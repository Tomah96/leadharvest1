# Investigation Plan: Missing Lead Data Issue
**Created**: 2025-08-10 by Orchestrator Claude
**Issue**: Leads like Daniela Lin (301) don't have their information displayed despite having it in the email

## 🔍 Current Situation

### What We Know:
1. **Lead 302 (Autanya Lucas)** - WORKING ✅
   - Has all data parsed correctly
   - Was manually updated by Backend Claude with test data
   - Has metadata with raw email content

2. **Lead 301 (Daniela Lin)** - NOT WORKING ❌
   - Only has first name "Daniela" (missing "Lin")
   - Shows HTML fragments in notes: `</div></td></tr><tr><td style=`
   - Missing ALL data: credit score (660-719), move-in (Aug 15), occupants (3), etc.
   - NO metadata field with raw email

3. **Daniela's Actual Email Contains**:
   - Full name: "Daniela Lin"
   - Message: "Hi Toma Holovatskyy, My partner, his mom, and I are moving..."
   - Move in: Aug 15, 2025
   - Credit score: 660 to 719
   - Pets: No
   - Lease Length: 12 months
   - Bedrooms: 2
   - Occupants: 3

## 🤔 Hypothesis: Why Data is Missing

### Most Likely Cause:
**The original email import didn't save the raw email content!**

When these leads were initially imported:
1. The old parser tried to extract data but failed on HTML
2. Only partial data was saved (first name, phone, property)
3. The raw email content was NOT stored
4. Now the new parser has nothing to re-parse

### Evidence:
- Lead 301 has `metadata: null` (no raw email stored)
- Lead 302 works because it was manually updated WITH raw email in metadata
- The HTML fragments in notes suggest failed parsing attempt

---

## 🔬 Investigation Tasks

### For Backend Claude (Priority 1):

#### Task 1: Verify Raw Email Storage
```bash
# Check how many leads have raw email in metadata
curl http://localhost:3001/api/leads | jq '.leads[] | select(.metadata != null) | .id'

# Check if Gmail API can still fetch original emails
curl http://localhost:3001/api/gmail/messages/{messageId}
```

#### Task 2: Check Import Process
1. Review `/backend/src/controllers/gmailController.js`
   - Does `processBatch` save raw email?
   - Does `handleWebhook` save raw email?

2. Check if we have Gmail message IDs:
   ```bash
   # Can we re-fetch emails from Gmail?
   curl http://localhost:3001/api/leads/301 | jq '.lead.gmail_message_id'
   ```

#### Task 3: Create Recovery Script
If we don't have raw emails saved:
1. Use Gmail message IDs to re-fetch original emails
2. Update leads with raw email content in metadata
3. Re-run parser on the raw content

---

### For Frontend Claude (Priority 2):

#### Task 1: Identify Affected Leads
Create a diagnostic view showing:
- Which leads have complete data
- Which leads are missing data
- Which leads have metadata/raw email

#### Task 2: Add Data Quality Indicators
- Show warning when lead is missing raw email
- Add "Re-import" button for leads with Gmail message IDs
- Display parsing status in lead list

---

### For Orchestrator (Me):

#### Task 1: Coordinate Investigation
1. Get Backend Claude to check email storage first
2. Determine if we can recover original emails
3. Create recovery plan based on findings

#### Task 2: Root Cause Analysis
Determine why:
- Some leads have data (302) and others don't (301)
- The original import didn't save raw emails
- Only partial parsing occurred

---

## 📊 Quick Diagnostic Commands

### Check All Zillow Leads:
```bash
# See which leads have metadata
for id in 270 271 272 273 274 275 276 277 278 279 280 281 282 283 284 285 286 287 288 289 290 291 292 293 294 295 296 297 298 299 300 301 302; do
  echo -n "Lead $id: "
  curl -s http://localhost:3001/api/leads/$id | grep -o '"metadata":[^,]*' | head -1
done
```

### Check Gmail Message IDs:
```bash
# See if we can re-fetch from Gmail
curl -s http://localhost:3001/api/leads | jq '.leads[] | select(.source == "zillow") | {id: .id, gmail_id: .gmail_message_id, has_metadata: (.metadata != null)}'
```

---

## 🔧 Solution Paths

### Option 1: Re-fetch from Gmail (Best)
If we have Gmail message IDs:
1. Create script to fetch original emails from Gmail API
2. Update leads with raw email in metadata
3. Re-parse with updated parser

### Option 2: Manual Data Entry
If Gmail emails are gone:
1. User provides email content
2. Manually update affected leads
3. Parse with new parser

### Option 3: Re-import from Gmail
If emails still exist in Gmail:
1. Re-run import process
2. Ensure raw emails are saved this time
3. Parse all data correctly

---

## 🎯 Expected Outcome

After investigation, we should know:
1. **Why** some leads have data and others don't
2. **Whether** we can recover the original emails
3. **How** to fix all affected leads
4. **What** changes to prevent this in future

---

## 📝 Next Steps

1. Backend Claude investigates email storage mechanism
2. Check if Gmail message IDs exist for affected leads
3. Determine recovery strategy based on findings
4. Implement fix for all affected leads
5. Update import process to always save raw emails

---

END OF INVESTIGATION PLAN