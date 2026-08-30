/**
 * ASTRAIV TECHNOLOGIES — GOOGLE APPS SCRIPT FOR FORM/SHEET REVIEW SYNCHRONIZATION
 * 
 * Instructions:
 * 1. Open your Google Sheet linked to the Google Form.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all content in Code.gs with this file.
 * 4. Update WEBHOOK_URL and WEBHOOK_SECRET with your production/staging values.
 * 5. Set up a trigger:
 *    - Click the Clock icon (Triggers) on the left sidebar.
 *    - Click "+ Add Trigger".
 *    - Choose which function to run: onFormSubmit
 *    - Select event source: "From spreadsheet"
 *    - Select event type: "On form submit"
 *    - Click Save and authorize permissions.
 */

var WEBHOOK_URL = "https://yourdomain.com/api/webhooks/google-sheets";
var WEBHOOK_SECRET = "your-secure-google-sheet-sync-secret-key-123456";

/**
 * Triggered automatically upon every Google Form submission into the Sheet.
 */
function onFormSubmit(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();
    
    // Read the headers (Row 1) and latest response (lastRow)
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowValues = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Helper map to find column by lower-cased header title
    var data = {};
    for (var i = 0; i < headers.length; i++) {
      var header = String(headers[i]).toLowerCase().trim();
      var val = rowValues[i];
      data[header] = val;
    }

    // Extract fields matching Google Form questions
    var clientName = data["name"] || data["client name"] || data["full name"] || data["your name"] || "Anonymous Client";
    var company = data["company"] || data["organization"] || data["company name"] || "";
    var designation = data["designation"] || data["role"] || data["title"] || data["job title"] || "";
    var review = data["review"] || data["feedback"] || data["testimonial"] || data["comments"] || "";
    var ratingRaw = data["rating"] || data["score"] || data["stars"] || 5;
    var rating = parseInt(ratingRaw, 10) || 5;
    var imageUrl = data["image"] || data["photo"] || data["avatar"] || data["linkedin"] || "";

    // Generate unique ID based on timestamp and row index
    var reviewId = "GF-" + new Date().getTime() + "-R" + lastRow;

    // Validate minimum review content before dispatch
    if (!review || review.toString().trim().length < 3) {
      Logger.log("Review is empty or too short. Skipping row " + lastRow);
      return;
    }

    var payload = {
      review_id: reviewId,
      client_name: String(clientName).trim(),
      company: String(company).trim(),
      designation: String(designation).trim(),
      review: String(review).trim(),
      rating: Math.min(Math.max(rating, 1), 5),
      image_url: String(imageUrl).trim()
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-webhook-secret": WEBHOOK_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Webhook Response Code: " + response.getResponseCode());
    Logger.log("Webhook Response Body: " + response.getContentText());

  } catch (error) {
    Logger.log("Error in onFormSubmit: " + error.toString());
  }
}

/**
 * Manual test runner function to verify webhook connectivity directly in Apps Script editor.
 */
function testWebhookSync() {
  var testPayload = {
    review_id: "TEST-MANUAL-" + new Date().getTime(),
    client_name: "John Test Client",
    company: "Acme Cloud Corp",
    designation: "Head of Infrastructure",
    review: "Astraiv Technologies delivered our multi-cloud deployment with zero hiccups. Remarkable engineering quality and precision.",
    rating: 5,
    image_url: ""
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": WEBHOOK_SECRET
    },
    payload: JSON.stringify(testPayload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
  Logger.log("Test Response: " + response.getContentText());
}
