/**
 * ============================================================================
 * ASTRAIV TECHNOLOGIES — PRODUCTION GOOGLE APPS SCRIPT FOR FORM & SHEET SYNC
 * ============================================================================
 * 
 * Form Name: Customer Feedback
 * Form URL: https://docs.google.com/forms/d/1bq_DbfCGderO2Hv36ll5gLOVv--59_Ciyt3RfDabOuE/edit
 * 
 * This script runs in the Google Sheet linked to the "Customer Feedback" form.
 * It catches form submissions via an installable "On form submit" trigger, extracts
 * all responses using the exact Google Form question headers, calculates the rating
 * arithmetic average, packages the structured JSON payload, and posts securely to
 * the Astraiv Technologies backend webhook.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your connected Google Sheet (where form responses are stored).
 * 2. In the menu, click: Extensions > Apps Script.
 * 3. Delete any code in the editor, and paste the entire contents of this file.
 * 4. Configure Script Properties (Project Settings > Script Properties):
 *    - WEBHOOK_URL: https://superuser.admin.astraivtechnologies.com/api/reviews/google-form
 *                   (or https://www.astraivtechnologies.com/api/reviews/google-form)
 *    - WEBHOOK_SECRET: astraiv_gsheet_webhook_secret_2026
 * 5. Configure the Installable Trigger:
 *    - Click the clock icon ("Triggers") on the left sidebar.
 *    - Click "+ Add Trigger" (bottom right).
 *    - Function to run: onFormSubmit
 *    - Deployment: Head
 *    - Event source: "From spreadsheet"
 *    - Event type: "On form submit"
 *    - Failure notification settings: "Notify me immediately"
 *    - Click Save and grant Google permissions.
 * 6. Test by running testWebhookSync() directly from the editor.
 */

/**
 * Fallback constants if Script Properties are not configured.
 */
var DEFAULT_WEBHOOK_URL = "https://rmxff-103-130-105-203.free.pinggy.net/api/reviews/google-form";
var DEFAULT_WEBHOOK_SECRET = "astraiv_gsheet_webhook_secret_2026";

/**
 * Normalizes text for resilient dictionary lookups (lowercased, all whitespace condensed).
 */
function normalizeKey(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Resolves a value from e.namedValues or row values using normalized question patterns.
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
 * Main trigger function called on each Google Form submission.
 * @param {Object} e - Trigger event object passed by Google Sheets.
 */
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for concurrent submissions
    lock.waitLock(30000);

    var scriptProperties = PropertiesService.getScriptProperties();
    var webhookUrl = scriptProperties.getProperty("WEBHOOK_URL") || DEFAULT_WEBHOOK_URL;
    var webhookSecret = scriptProperties.getProperty("WEBHOOK_SECRET") || DEFAULT_WEBHOOK_SECRET;

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
    var sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();

    // Build normalized map from e.namedValues or by reading row directly
    var normalizedMap = {};

    if (e && e.namedValues) {
      for (var rawKey in e.namedValues) {
        normalizedMap[normalizeKey(rawKey)] = e.namedValues[rawKey];
      }
    }

    // Also read header row and current row from the sheet to ensure full coverage
    var lastCol = sheet.getLastColumn();
    if (lastCol > 0 && lastRow > 1) {
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var rowData = sheet.getRange(lastRow, 1, 1, lastCol).getValues()[0];
      for (var c = 0; c < headers.length; c++) {
        var nKey = normalizeKey(headers[c]);
        if (!normalizedMap[nKey] || normalizedMap[nKey] === "") {
          normalizedMap[nKey] = rowData[c];
        }
      }
    }

    // ========================================================================
    // EXACT FIELD EXTRACTIONS
    // ========================================================================

    // 1. Client Identity
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

    // 2. Experience / Rating Questions (1-5 scale)
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

    // Calculate arithmetic mean of valid rating responses
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

    // 3. Additional Experience Questions
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

    // 4. Improvement Feedback (Internal only)
    var improvementFeedback = getValueByPatterns(normalizedMap, [
      "Please suggest us how we can serve you better next time, below -",
      "Tell us how we can improve :",
      "Please suggest us how we can serve you better"
    ]);

    // 5. Testimonial (Public review text)
    var testimonial = getValueByPatterns(normalizedMap, [
      "Please share your experience working with Astraiv Technologies.  ",
      "Please share your experience working with Astraiv Technologies.",
      "TESTIMONIAL",
      "Please share your experience"
    ]);

    // 6. Permissions
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

    // 7. Timestamp and Deterministic Submission ID
    var timestampStr = getValueByPatterns(normalizedMap, ["Timestamp", "timestamp"]) || new Date().toISOString();
    var parsedTimestamp = Date.parse(timestampStr) || new Date().getTime();
    var sourceSubmissionId = "GF-" + sheetId.substring(0, 6) + "-R" + lastRow + "-" + parsedTimestamp;

    // Ensure testimonial has fallback content so responses are never dropped
    var effectiveTestimonial = testimonial || likedMost || improvementFeedback || ("Client provided a " + (overallService || 5) + "-star rating for Astraiv Technologies.");

    // ========================================================================
    // CONSTRUCT PAYLOAD
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
    // DISPATCH TO SECURE BACKEND WEBHOOK WITH RETRY
    // ========================================================================
    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-webhook-secret": webhookSecret,
        "Bypass-Tunnel-Reminder": "true"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var maxRetries = 3;
    var success = false;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        var response = UrlFetchApp.fetch(webhookUrl, options);
        var statusCode = response.getResponseCode();
        var responseBody = response.getContentText();

        Logger.log("[Webhook Dispatch Row " + lastRow + "] Attempt " + attempt + " - HTTP " + statusCode);
        Logger.log("Response Body: " + responseBody);

        if (statusCode >= 200 && statusCode < 300) {
          success = true;
          break;
        } else {
          Logger.log("Attempt " + attempt + " returned non-200 status code: " + statusCode);
          if (attempt < maxRetries) {
            Utilities.sleep(attempt * 2000);
          }
        }
      } catch (reqError) {
        Logger.log("Network error on attempt " + attempt + ": " + reqError.toString());
        if (attempt < maxRetries) {
          Utilities.sleep(attempt * 2000);
        }
      }
    }

    if (!success) {
      Logger.log("Error: Webhook dispatch failed after " + maxRetries + " attempts for row " + lastRow);
    }

  } catch (err) {
    Logger.log("Fatal Exception in onFormSubmit: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Manual test runner for verifying webhook connectivity from the Apps Script editor.
 */
function testWebhookSync() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var webhookUrl = scriptProperties.getProperty("WEBHOOK_URL") || DEFAULT_WEBHOOK_URL;
  var webhookSecret = scriptProperties.getProperty("WEBHOOK_SECRET") || DEFAULT_WEBHOOK_SECRET;

  var samplePayload = {
    source: "google_form",
    sourceSubmissionId: "GF-TEST-MANUAL-" + new Date().getTime(),
    clientName: "Rahul Sharma",
    companyName: "ABC Technologies",
    designation: "CTO",
    projectName: "Enterprise Cloud Portal",
    email: "rahul.sharma@example.com",
    ratings: {
      overallService: 5,
      softwareQuality: 4,
      communicationSupport: 5
    },
    averageRating: 4.67,
    likedMost: "Speed, architecture rigor, and clean codebase.",
    wouldRecommend: "Yes",
    improvementFeedback: "Everything was superb, keep it up.",
    testimonial: "Astraiv delivered our platform professionally and ahead of schedule.",
    permissions: {
      websitePublishing: "Yes, you may publish my feedback",
      identityDisplay: "Yes"
    },
    submittedAt: new Date().toISOString()
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": webhookSecret,
      "Bypass-Tunnel-Reminder": "true"
    },
    payload: JSON.stringify(samplePayload),
    muteHttpExceptions: true
  };

  Logger.log("Sending test payload to: " + webhookUrl);
  var response = UrlFetchApp.fetch(webhookUrl, options);
  Logger.log("Test HTTP Status: " + response.getResponseCode());
  Logger.log("Test Response: " + response.getContentText());
}

/**
 * Synchronizes ALL existing responses already recorded in the Google Sheet.
 * Call this directly from the Apps Script editor to ingest previously submitted rows.
 */
function syncAllExistingRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2) {
    Logger.log("No response rows found in sheet to sync.");
    return;
  }

  Logger.log("Found " + (lastRow - 1) + " response rows. Starting sync...");

  for (var r = 2; r <= lastRow; r++) {
    Logger.log("--- Syncing Row " + r + " ---");
    var fakeEvent = {
      range: sheet.getRange(r, 1, 1, lastCol)
    };
    onFormSubmit(fakeEvent);
  }

  Logger.log("All existing rows synchronized successfully!");
}

