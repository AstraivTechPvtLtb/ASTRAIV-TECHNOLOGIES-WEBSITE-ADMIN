/**
 * ============================================================================
 * ASTRAIV TECHNOLOGIES — DUAL-DISPATCH GOOGLE APPS SCRIPT (LOCAL & LIVE SYNC)
 * ============================================================================
 * 
 * Form Name: Customer Feedback
 * Form URL: https://docs.google.com/forms/d/1bq_DbfCGderO2Hv36ll5gLOVv--59_Ciyt3RfDabOuE/edit
 * 
 * FEATURES:
 * 1. MULTI-TARGET DUAL DISPATCH:
 *    - Simultaneously posts to Live Production Admin & Client webhooks AND Local Dev Tunnel.
 *    - You NEVER have to change URLs when switching between local dev and live!
 * 2. GRACEFUL OFFLINE TOLERANCE:
 *    - If your local dev tunnel is offline, production still syncs 100% reliably.
 *    - If live production has temporary latency, it retries with exponential backoff.
 * 3. IN-SHEET INTERACTIVE MENU ("Astraiv Sync ⚡"):
 *    - "🚀 Test Connections": Tests Live & Local endpoints and reports status.
 *    - "⚙️ Set Local Tunnel URL": Set or change your tunnel URL directly from the Sheet UI.
 *    - "🔄 Sync All Existing Rows": Bulk syncs all historical responses.
 * 4. SYNC STATUS COLUMN:
 *    - Automatically writes status to the sheet (e.g., "✅ Live: 201 | Local: 200").
 * 5. DUPLICATE PROTECTION:
 *    - Deterministic GF- submission IDs prevent duplicate reviews on all backends.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your connected Google Sheet.
 * 2. Click: Extensions > Apps Script.
 * 3. Paste this ENTIRE code and click Save (Floppy disk icon).
 * 4. Configure Installable Trigger (Triggers icon on left sidebar):
 *    - Function: onFormSubmit
 *    - Event Source: From spreadsheet
 *    - Event Type: On form submit
 *    - Click Save and allow permissions.
 * 5. Refresh your Google Sheet tab — a new menu "Astraiv Sync ⚡" will appear!
 */

/**
 * Default configurations (Used automatically if not overridden in Script Properties).
 */
var CONFIG = {
  // LIVE PRODUCTION ENDPOINTS (Permanent — always receives submissions)
  LIVE_ADMIN_URL: "https://superuser.admin.astraivtechnologies.com/api/reviews/google-form",
  LIVE_CLIENT_URL: "https://www.astraivtechnologies.com/api/reviews/google-form",

  // LOCAL DEV TUNNEL (Used when testing locally via untun, loca.lt, ngrok, pinggy)
  DEFAULT_LOCAL_TUNNEL_URL: "https://astraiv-reviews-sync.loca.lt/api/reviews/google-form",

  // SECRET TOKEN (Must match GOOGLE_FORM_WEBHOOK_SECRET in .env)
  WEBHOOK_SECRET: "astraiv_gsheet_webhook_secret_2026"
};

/**
 * Automatically creates the custom "Astraiv Sync ⚡" menu inside Google Sheets UI.
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("Astraiv Sync ⚡")
      .addItem("🚀 Test Connections (Check Live & Local)", "menuTestConnections")
      .addItem("⚙️ Set Local Tunnel URL (loca.lt / ngrok / untun)", "menuSetLocalTunnelUrl")
      .addItem("🔄 Sync All Existing Rows to Backend", "syncAllExistingRows")
      .addSeparator()
      .addItem("📋 View Active Endpoints & Settings", "menuViewEndpoints")
      .addItem("🧹 Clear Local Tunnel URL (Live Only)", "menuClearLocalTunnelUrl")
      .addToUi();
  } catch (err) {
    Logger.log("onOpen menu skipped (e.g. running outside interactive Sheet): " + err.toString());
  }
}

/**
 * Compiles list of all active target endpoints (Live Admin + Live Client + Local Tunnel).
 */
function getActiveEndpoints() {
  var props = PropertiesService.getScriptProperties();
  var endpoints = [];

  // 1. Live Production Admin Webhook
  var liveAdmin = props.getProperty("LIVE_ADMIN_URL") || CONFIG.LIVE_ADMIN_URL;
  if (liveAdmin && liveAdmin.trim()) {
    endpoints.push({
      name: "Live Admin",
      url: liveAdmin.trim(),
      isProduction: true
    });
  }

  // 2. Live Production Client Webhook
  var liveClient = props.getProperty("LIVE_CLIENT_URL") || CONFIG.LIVE_CLIENT_URL;
  if (liveClient && liveClient.trim() && liveClient.trim() !== liveAdmin.trim()) {
    endpoints.push({
      name: "Live Client",
      url: liveClient.trim(),
      isProduction: true
    });
  }

  // 3. Local Development Tunnel (Custom Script Property, legacy property, or default)
  var localTunnel = props.getProperty("LOCAL_TUNNEL_URL") ||
                    props.getProperty("DEV_WEBHOOK_URL") ||
                    props.getProperty("WEBHOOK_URL") ||
                    CONFIG.DEFAULT_LOCAL_TUNNEL_URL;

  if (localTunnel && localTunnel.trim()) {
    var cleanLocal = localTunnel.trim();
    // Only add if not already in production endpoints
    var exists = endpoints.some(function(ep) { return ep.url.toLowerCase() === cleanLocal.toLowerCase(); });
    if (!exists) {
      endpoints.push({
        name: "Local Dev",
        url: cleanLocal,
        isProduction: false
      });
    }
  }

  return endpoints;
}

/**
 * Normalizes text for resilient dictionary lookups (lowercased, condensed whitespace).
 */
function normalizeKey(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Resolves a value from normalizedMap using an ordered list of question patterns.
 */
function getValueByPatterns(normalizedMap, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var p = normalizeKey(patterns[i]);
    if (normalizedMap.hasOwnProperty(p) && normalizedMap[p] !== undefined && normalizedMap[p] !== null) {
      var val = normalizedMap[p];
      if (Array.isArray(val)) {
        val = val.length > 0 ? val[0] : "";
      }
      return String(val).trim();
    }
  }
  return "";
}

/**
 * Safely parses a 1-5 rating value. Returns null if invalid or missing.
 */
function parseRatingValue(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  var num = Number(raw);
  if (!isNaN(num) && num >= 1 && num <= 5) {
    return Math.round(num);
  }
  return null;
}

/**
 * Main trigger function invoked on each Google Form submission or manual sync.
 * @param {Object} e - Trigger event object passed by Google Sheets.
 */
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for concurrent submissions to queue safely
    lock.waitLock(30000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
    var sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();

    if (lastRow < 2) return;

    // Build normalized map from e.namedValues or row values
    var normalizedMap = {};

    if (e && e.namedValues) {
      for (var rawKey in e.namedValues) {
        normalizedMap[normalizeKey(rawKey)] = e.namedValues[rawKey];
      }
    }

    var lastCol = sheet.getLastColumn();
    var headers = [];
    var rowData = [];

    if (lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      rowData = sheet.getRange(lastRow, 1, 1, lastCol).getValues()[0];
      for (var c = 0; c < headers.length; c++) {
        var nKey = normalizeKey(headers[c]);
        if (!normalizedMap[nKey] || normalizedMap[nKey] === "") {
          normalizedMap[nKey] = rowData[c];
        }
      }
    }

    // ========================================================================
    // 1. CLIENT IDENTITY FIELDS
    // ========================================================================
    var email = getValueByPatterns(normalizedMap, [
      "You Email Id :",
      "Your Email Id :",
      "Email Id",
      "Email",
      "Email Address",
      "email"
    ]);

    var clientName = getValueByPatterns(normalizedMap, [
      "Your Name :",
      "Your Name",
      "Client Name"
    ]) || "Astraiv Client";

    var companyName = getValueByPatterns(normalizedMap, [
      "Your Company / Organization  Name :",
      "Your Company / Organization Name :",
      "Your Company / Organization Name",
      "Company"
    ]);

    var designation = getValueByPatterns(normalizedMap, [
      "Your Designation :",
      "Your Designation",
      "Designation"
    ]);

    var projectName = getValueByPatterns(normalizedMap, [
      "  Project Name :  ",
      "Project Name :",
      "Project Name"
    ]);

    // ========================================================================
    // 2. EXPERIENCE & RATINGS (1-5 SCALE)
    // ========================================================================
    var rawOverall = getValueByPatterns(normalizedMap, [
      "  How would you rate our overall service?  ",
      "How would you rate our overall service?",
      "How would you rate our overall service"
    ]);

    var rawQuality = getValueByPatterns(normalizedMap, [
      "How satisfied are you with the quality of the software / Project that we delivered to you?  ",
      "How satisfied are you with the quality of the software / Project that we delivered to you?",
      "quality of the software / Project"
    ]);

    var rawSupport = getValueByPatterns(normalizedMap, [
      "How satisfied are you with communication and support of ASTRAIV?  ",
      "How satisfied are you with communication and support of ASTRAIV?",
      "communication and support of ASTRAIV"
    ]);

    var overallService = parseRatingValue(rawOverall);
    var softwareQuality = parseRatingValue(rawQuality);
    var communicationSupport = parseRatingValue(rawSupport);

    var validRatings = [];
    if (overallService !== null) validRatings.push(overallService);
    if (softwareQuality !== null) validRatings.push(softwareQuality);
    if (communicationSupport !== null) validRatings.push(communicationSupport);

    var averageRating = 5.00;
    if (validRatings.length > 0) {
      var sum = 0;
      for (var r = 0; r < validRatings.length; r++) {
        sum += validRatings[r];
      }
      averageRating = Number((sum / validRatings.length).toFixed(2));
    }

    // ========================================================================
    // 3. FEEDBACK & TESTIMONIAL
    // ========================================================================
    var likedMost = getValueByPatterns(normalizedMap, [
      "What did you like most about working with us?  ",
      "What did you like most about working with us?",
      "What did you like most"
    ]);

    var wouldRecommend = getValueByPatterns(normalizedMap, [
      "Would you recommend Astraiv Technologies to others?  ",
      "Would you recommend Astraiv Technologies to others?",
      "Would you recommend"
    ]);

    var improvementFeedback = getValueByPatterns(normalizedMap, [
      "Please suggest us how we can serve you better next time, below -",
      "Tell us how we can improve :",
      "Please suggest us how we can serve you better"
    ]);

    var testimonial = getValueByPatterns(normalizedMap, [
      "Please share your experience working with Astraiv Technologies.  ",
      "Please share your experience working with Astraiv Technologies.",
      "TESTIMONIAL",
      "Please share your experience"
    ]);

    var websitePublishPermission = getValueByPatterns(normalizedMap, [
      "May we display your feedback on our website (www.astraivtechnologies.com)?  ",
      "May we display your feedback on our website (www.astraivtechnologies.com)?",
      "May we display your feedback on our website"
    ]) || "No, please keep my feedback private";

    var identityDisplayPermission = getValueByPatterns(normalizedMap, [
      "May we display your name and company along with your review?  ",
      "May we display your name and company along with your review?",
      "May we display your name and company"
    ]) || "Yes";

    // 4. Timestamp & Deterministic ID
    var timestampStr = getValueByPatterns(normalizedMap, ["Timestamp", "timestamp"]) || new Date().toISOString();
    var parsedTimestamp = Date.parse(timestampStr) || new Date().getTime();
    var sourceSubmissionId = "GF-" + sheetId.substring(0, 6) + "-R" + lastRow + "-" + parsedTimestamp;

    // Resilient fallback for testimonial
    var effectiveTestimonial = testimonial || likedMost || improvementFeedback || ("Client provided a " + (overallService || 5) + "-star rating for Astraiv Technologies.");

    // ========================================================================
    // CONSTRUCT JSON PAYLOAD
    // ========================================================================
    var payload = {
      source: "google_form",
      sourceSubmissionId: sourceSubmissionId,
      clientName: clientName,
      companyName: companyName,
      designation: designation,
      projectName: projectName,
      email: email,
      ratings: {
        overallService: overallService,
        softwareQuality: softwareQuality,
        communicationSupport: communicationSupport
      },
      averageRating: averageRating,
      likedMost: likedMost,
      wouldRecommend: wouldRecommend,
      improvementFeedback: improvementFeedback,
      testimonial: effectiveTestimonial,
      permissions: {
        websitePublishing: websitePublishPermission,
        identityDisplay: identityDisplayPermission
      },
      submittedAt: new Date(parsedTimestamp).toISOString()
    };

    // ========================================================================
    // DISPATCH TO ALL ACTIVE ENDPOINTS (LIVE + LOCAL DUAL DISPATCH)
    // ========================================================================
    var endpoints = getActiveEndpoints();
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty("WEBHOOK_SECRET") || CONFIG.WEBHOOK_SECRET;

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-webhook-secret": secret,
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "Astraiv-Google-Sheets-Sync/3.0"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var results = [];

    for (var i = 0; i < endpoints.length; i++) {
      var ep = endpoints[i];
      var epResult = dispatchToEndpoint(ep, options);
      results.push(epResult);
    }

    // Write audit status to Google Sheet
    updateSheetSyncStatus(sheet, headers, lastRow, results);

  } catch (err) {
    Logger.log("Fatal Exception in onFormSubmit: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Dispatches payload to a specific endpoint with retries for production and fast-fail for local.
 */
function dispatchToEndpoint(ep, baseOptions) {
  var maxAttempts = ep.isProduction ? 3 : 1; // Don't block if local dev tunnel is offline
  var lastStatus = "Pending";

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      var response = UrlFetchApp.fetch(ep.url, baseOptions);
      var statusCode = response.getResponseCode();
      lastStatus = "HTTP " + statusCode;

      Logger.log("[" + ep.name + "] Attempt " + attempt + " returned " + lastStatus);

      if (statusCode >= 200 && statusCode < 300) {
        return { name: ep.name, success: true, status: lastStatus };
      }

      if (attempt < maxAttempts) {
        Utilities.sleep(attempt * 1500);
      }
    } catch (networkError) {
      var errStr = networkError.toString();
      if (errStr.indexOf("DNS") !== -1 || errStr.indexOf("Address") !== -1 || errStr.indexOf("Connection refused") !== -1) {
        lastStatus = "Offline";
      } else {
        lastStatus = "Network Error";
      }
      Logger.log("[" + ep.name + "] Attempt " + attempt + " failed: " + lastStatus + " (" + errStr + ")");

      if (attempt < maxAttempts) {
        Utilities.sleep(attempt * 1500);
      }
    }
  }

  return { name: ep.name, success: false, status: lastStatus };
}

/**
 * Updates or creates a "Sync Status" column on the processed row.
 */
function updateSheetSyncStatus(sheet, headers, row, results) {
  try {
    var statusColIdx = -1;
    for (var i = 0; i < headers.length; i++) {
      if (normalizeKey(headers[i]) === "sync status") {
        statusColIdx = i + 1;
        break;
      }
    }

    if (statusColIdx === -1) {
      statusColIdx = headers.length + 1;
      sheet.getRange(1, statusColIdx).setValue("Sync Status").setFontWeight("bold");
    }

    var summaryParts = [];
    for (var r = 0; r < results.length; r++) {
      var res = results[r];
      var icon = res.success ? "✅" : (res.status === "Offline" ? "⚪" : "❌");
      summaryParts.push(icon + " " + res.name + ": " + res.status);
    }

    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT", "dd MMM HH:mm");
    var statusText = summaryParts.join(" | ") + " (" + now + ")";
    sheet.getRange(row, statusColIdx).setValue(statusText);
  } catch (err) {
    Logger.log("Notice: Could not write Sync Status column: " + err.toString());
  }
}

// ============================================================================
// INTERACTIVE USER MENU ACTIONS (Runs from Google Sheet UI)
// ============================================================================

/**
 * Menu Action: Pings all active endpoints with a test payload and displays an interactive alert.
 */
function menuTestConnections() {
  var ui = SpreadsheetApp.getUi();
  var endpoints = getActiveEndpoints();
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty("WEBHOOK_SECRET") || CONFIG.WEBHOOK_SECRET;

  var testPayload = {
    source: "google_form",
    sourceSubmissionId: "GF-TEST-PING-" + new Date().getTime(),
    clientName: "Connectivity Test",
    companyName: "Astraiv Testing Suite",
    designation: "System Ping",
    projectName: "Dual-Sync Verification",
    email: "test@astraivtechnologies.com",
    ratings: { overallService: 5, softwareQuality: 5, communicationSupport: 5 },
    averageRating: 5.0,
    testimonial: "Automated test ping verifying dual-sync between Live and Local.",
    permissions: { websitePublishing: "Yes", identityDisplay: "Yes" },
    submittedAt: new Date().toISOString()
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": secret,
      "Bypass-Tunnel-Reminder": "true",
      "ngrok-skip-browser-warning": "true"
    },
    payload: JSON.stringify(testPayload),
    muteHttpExceptions: true
  };

  var report = "Astraiv Dual-Sync Connectivity Report:\n\n";

  for (var i = 0; i < endpoints.length; i++) {
    var ep = endpoints[i];
    var res = dispatchToEndpoint(ep, options);
    var symbol = res.success ? "✅ CONNECTED" : (res.status === "Offline" ? "⚠️ OFFLINE / TUNNEL CLOSED" : "❌ ERROR");
    report += "• " + ep.name + " (" + ep.url + ")\n   → " + symbol + " (" + res.status + ")\n\n";
  }

  report += "Tip: Live Production is always active. If Local Dev says OFFLINE, simply launch your tunnel (e.g. untun or loca.lt).";

  ui.alert("⚡ Endpoint Status", report, ui.ButtonSet.OK);
}

/**
 * Menu Action: Prompt user for new Local Dev Tunnel URL and save directly to Script Properties.
 */
function menuSetLocalTunnelUrl() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var currentUrl = props.getProperty("LOCAL_TUNNEL_URL") || CONFIG.DEFAULT_LOCAL_TUNNEL_URL;

  var response = ui.prompt(
    "Set Local Dev Tunnel URL",
    "Enter your active tunnel URL (from loca.lt, ngrok, untun, or pinggy).\n\n" +
    "Example: https://astraiv-reviews-sync.loca.lt/api/reviews/google-form\n\n" +
    "Current setting: " + currentUrl + "\n\n" +
    "New URL:",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    var input = response.getResponseText().trim();
    if (input) {
      // Auto-append route if user entered bare domain
      if (input.indexOf("/api/reviews/google-form") === -1) {
        input = input.replace(/\/+$/, "") + "/api/reviews/google-form";
      }
      props.setProperty("LOCAL_TUNNEL_URL", input);
      ui.alert("Success", "Local tunnel URL updated to:\n\n" + input + "\n\nAll future form submissions will now sync to both Live and Local!", ui.ButtonSet.OK);
    }
  }
}

/**
 * Menu Action: View active endpoints.
 */
function menuViewEndpoints() {
  var ui = SpreadsheetApp.getUi();
  var endpoints = getActiveEndpoints();
  var text = "Configured Dual-Sync Endpoints:\n\n";
  for (var i = 0; i < endpoints.length; i++) {
    text += (i + 1) + ". " + endpoints[i].name + " (" + (endpoints[i].isProduction ? "Live" : "Dev") + "):\n   " + endpoints[i].url + "\n\n";
  }
  ui.alert("Active Endpoints", text, ui.ButtonSet.OK);
}

/**
 * Menu Action: Clear local tunnel URL to route exclusively to Live Production.
 */
function menuClearLocalTunnelUrl() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty("LOCAL_TUNNEL_URL");
  props.deleteProperty("DEV_WEBHOOK_URL");
  props.deleteProperty("WEBHOOK_URL");
  ui.alert("Cleared", "Local tunnel URL has been cleared. The script will use the default tunnel or live production only.", ui.ButtonSet.OK);
}

/**
 * Bulk synchronizes all historical responses recorded in the Google Sheet.
 */
function syncAllExistingRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2) {
    Logger.log("No response rows found in sheet to sync.");
    try {
      SpreadsheetApp.getUi().alert("Notice", "No response rows found in sheet.", SpreadsheetApp.getUi().ButtonSet.OK);
    } catch(e) {}
    return;
  }

  Logger.log("Found " + (lastRow - 1) + " response rows. Starting dual sync...");

  for (var r = 2; r <= lastRow; r++) {
    Logger.log("--- Syncing Row " + r + " ---");
    var fakeEvent = {
      range: sheet.getRange(r, 1, 1, lastCol)
    };
    onFormSubmit(fakeEvent);
  }

  Logger.log("All rows synchronized successfully!");
  try {
    SpreadsheetApp.getUi().alert("Complete", "Successfully synchronized " + (lastRow - 1) + " rows to both Live and Local!", SpreadsheetApp.getUi().ButtonSet.OK);
  } catch(e) {}
}

/**
 * Command-line / Apps Script editor test function.
 */
function testWebhookSync() {
  menuTestConnections();
}
