# Simple Test Interface Guide

## Overview

The Simple Test Interface (`/test/simple`) provides a streamlined way to test Gmail integration with detailed browser console logging.

## Features

1. **Test Gmail Connection**
   - Verifies OAuth authentication
   - Lists all available Gmail labels
   - Shows connection status

2. **Search Gmail Labels**
   - Search for specific labels by name
   - Filter results in real-time
   - View label details in console

3. **Import Emails**
   - Quick import buttons: 5, 10, 50, All
   - Processes emails from specified label
   - Shows detailed parsing results

## How to Use

1. **Open Browser Console**
   - Press F12 (or Cmd+Option+I on Mac)
   - Click on "Console" tab
   - Keep console open while testing

2. **Test Connection First**
   - Click "Test Connection" button
   - Check console for:
     - Connection status (✅ or ❌)
     - List of Gmail labels in table format
     - Full response data as expandable object

3. **Search for Labels**
   - Enter label name in search box (default: "processed-lead")
   - Click search button
   - Console shows:
     - Matching labels in table format
     - Each label as expandable object with full details

4. **Import Emails**
   - Choose import count (5, 10, 50, or All)
   - Console displays:
     - Import summary with counts
     - Individual emails as expandable objects
     - Source breakdown in table format
     - Any parsing errors

## Console Output Structure

### Connection Test
```javascript
🔍 Gmail Connection Test
  ✅ Response received: {data: {...}}
  📊 Full response data: {connected: true, labels: [...]}
  📧 Gmail Labels Found: 25
  └─ Table view of all labels
```

### Label Search
```javascript
🏷️ Label Search: "processed-lead"
  Found 1 matching labels:
  └─ Table view of matching labels
  Label 1: {id: "Label_123", name: "processed-lead", type: "user"}
```

### Email Import
```javascript
📥 Email Import (10 emails)
  ✅ Import Response: {data: {...}}
  📊 Full Data Structure: {totalEmails: 10, successCount: 8, ...}
  📈 Import Summary: {sources: {...}}
  📧 Individual Email Results
    ✅ Email 1: {subject: "...", from: "...", source: "zillow", ...}
    ✅ Email 2: {subject: "...", from: "...", source: "realtor", ...}
    ❌ Email 3: {subject: "...", from: "...", source: "unknown", ...}
  📊 Source Breakdown
    └─ Table showing email counts by source
  ⚠️ Parsing Errors (if any)
    └─ Detailed error information
```

## Benefits

1. **Developer-Friendly**: Uses native browser console for detailed inspection
2. **Expandable Objects**: Click arrows to explore nested data
3. **Organized Groups**: Related logs are grouped with collapsible sections
4. **Visual Indicators**: ✅ for success, ❌ for errors, 📊 for data
5. **Tables**: Key data displayed in sortable table format

## Tips

- Keep console open before starting tests
- Use console filters to focus on specific output
- Right-click objects to store as global variables
- Use console.table() output for easy data analysis
- Check "Preserve log" to keep history between page reloads

## Summary Display

The UI shows a simple activity summary with timestamps, while the browser console contains all the detailed, explorable data structures.