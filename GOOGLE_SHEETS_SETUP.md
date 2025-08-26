# 🚀 Google Sheets Integration Setup

## Overview
This guide will help you connect your "Join the First 30" form to a Google Sheet to automatically collect user applications.

## Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Inigo - First 30 Applications"
4. Add these headers in row 1:
   - **A1**: Timestamp
   - **B1**: Name
   - **C1**: Email
   - **D1**: Discovery Source
   - **E1**: Device OS
   - **F1**: Motivation
   - **G1**: Readiness Level

## Step 2: Create Google Apps Script
1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Replace the default code with this:

```javascript
function doPost(e) {
  try {
    // Handle FormData from the website
    const formData = e.parameter;
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Prepare row data
    const rowData = [
      formData.timestamp || new Date().toISOString(),
      formData.name || '',
      formData.email || '',
      formData.source || '',
      formData.device || '',
      formData.motivation || '',
      formData.readiness || ''
    ];
    
    // Add the row to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput('Application submitted successfully!')
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput('Error: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Inigo Form Handler is running!');
}
```

## Step 3: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Choose **Web app** as type
3. Set **Execute as**: "Me"
4. Set **Who has access**: "Anyone"
5. Click **Deploy**
6. **Copy the Web App URL** (you'll need this)

## Step 4: Update Your Website
1. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL` in `src/app/page.tsx` with your actual Web App URL
2. Uncomment the fetch code:

```typescript
const response = await fetch('YOUR_ACTUAL_GOOGLE_APPS_SCRIPT_URL', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json' }
});

if (!response.ok) {
  throw new Error('Failed to submit');
}
```

## Step 5: Test the Integration
1. Fill out the form on your website
2. Submit the form
3. Check your Google Sheet - you should see a new row with the data
4. Check browser console for any errors

## Troubleshooting

### CORS Issues
If you get CORS errors, you may need to add this to your Apps Script:

```javascript
function doPost(e) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  // ... rest of your code
}
```

### Form Not Submitting
1. Check browser console for errors
2. Verify the Google Apps Script URL is correct
3. Make sure the Apps Script is deployed as a web app
4. Check that "Anyone" has access to the web app

## Data Structure
Your Google Sheet will automatically collect:
- **Timestamp**: When the application was submitted
- **Name**: Full name of the applicant
- **Email**: Contact email address
- **Discovery Source**: How they found Inigo
- **Device OS**: Their primary device operating system
- **Motivation**: What motivates them to join
- **Readiness Level**: How ready they feel to be a founding member

## Security Notes
- The web app is public, so anyone can submit data
- Consider adding basic validation in Apps Script
- You can add rate limiting to prevent spam
- Monitor submissions regularly

## Next Steps
1. Set up email notifications for new applications
2. Add data validation and cleaning
3. Create a dashboard to track applications
4. Set up automated follow-up emails

---

**Need help?** Check the [Google Apps Script documentation](https://developers.google.com/apps-script) or test with a simple form submission first.
