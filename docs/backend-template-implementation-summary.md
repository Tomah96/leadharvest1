# Backend Message Templates - Implementation Summary

## ✅ COMPLETE - Ready for Frontend Integration

### What Was Built

#### 1. Database Schema Updates
- **tour_availability** column added to leads table (JSONB)
- **message_templates** table created with:
  - Template types: initial_contact, follow_up, tour_confirmation, custom
  - Default templates pre-loaded
  - Variables tracking
  - One default per type constraint

#### 2. Tour Date Parser (`/backend/src/utils/tourDateParser.js`)
Handles 20+ date/time formats:
- Slash dates: "8/4", "08/04/2025"
- Written dates: "August 15th", "Sep 10"
- Relative dates: "tomorrow", "next Monday"
- Times: "2pm", "14:00", "afternoon"
- Ranges: "Monday-Friday", "8/4-8/6"
- Preferences: "weekends", "mornings"

Returns structured JSON:
```json
{
  "parsed": true,
  "slots": [
    {"date": "2025-09-05", "time": "14:00", "confidence": 0.95}
  ],
  "preferences": {
    "preferred_days": ["weekends"],
    "preferred_times": ["afternoon"]
  }
}
```

#### 3. Email Parser Updates
- Zillow parser now extracts tour availability
- Looks for patterns like:
  - "available on..."
  - "can tour..."
  - Day/time mentions in inquiry message
- Stores in lead.tour_availability field

#### 4. Template Service (`/backend/src/services/templateService.js`)

**Variable Substitution:**
- Basic fields: {first_name}, {property_address}, {phone}, etc.
- Smart sections: {acknowledgment_text}, {missing_info}, {tour_question}
- Agent info: {agent_name}, {agent_company}, {agent_phone}

**Smart Acknowledgments:**
- Recognizes what info was provided
- Formats nicely: "I see you have an income of $75,000 and credit score of 720"

**Tour Questions:**
- Adapts based on availability provided
- Date only: "What time works best?"
- Time only: "What days work?"
- No info: "When would be a good time to tour?"

#### 5. API Routes (`/backend/src/routes/templateRoutes.js`)

```
GET    /api/templates                 - List all templates
GET    /api/templates/:id             - Get specific template
GET    /api/templates/default/:type   - Get default by type
POST   /api/templates                 - Create new template
PUT    /api/templates/:id             - Update template
DELETE /api/templates/:id             - Delete template
POST   /api/templates/preview         - Preview with sample/lead data
POST   /api/templates/apply           - Apply template to lead
```

### How It Works

1. **Email Processing:**
   - Email arrives → Parser extracts tour dates → Stored in lead.tour_availability

2. **Template Application:**
   - User selects template → Service fetches lead data
   - Variables substituted → Smart sections generated
   - Final message ready to send

3. **Example Output:**
```
Hello Sarah,

Thank you for your interest in 456 Oak Street.

I see that you have an income of $85,000, credit score range of 740-800, 
2 occupants, and pets (one cat). I see you're available Thursday, September 4 
at 2pm or Friday, September 5 in the morning.

Would any of these times work for a tour, or would you prefer a different time?

Best regards,
Tom
Plus Realtors
(216) 555-8888
```

### Testing

Run the test file:
```bash
cd backend
node test-templates.js
```

Test API endpoints:
```bash
# Get all templates
curl http://localhost:3001/api/templates

# Preview with sample data
curl -X POST http://localhost:3001/api/templates/preview \
  -H "Content-Type: application/json" \
  -d '{"template": "Hi {first_name}!", "leadData": {"first_name": "Test"}}'
```

### What Frontend Needs to Do

1. **Template Management Page** (`/settings/templates`)
   - List templates with edit/delete
   - Template editor with variable palette
   - Live preview panel

2. **Conversation Integration**
   - Template dropdown in conversation window
   - Apply template button
   - Show processed message before sending

3. **Lead Actions**
   - Quick template apply from lead card
   - Bulk apply templates to multiple leads

### Files Created/Modified

**New Files:**
- `/backend/migrations/004_add_tour_availability.sql`
- `/backend/migrations/005_create_message_templates.sql`
- `/backend/src/utils/tourDateParser.js`
- `/backend/src/services/templateService.js`
- `/backend/src/routes/templateRoutes.js`
- `/backend/test-templates.js`

**Modified Files:**
- `/backend/src/parsers/zillowParser.js` - Added tour extraction
- `/backend/src/services/leadService.js` - Store tour_availability
- `/backend/app.js` - Added template routes

### Dependencies Added
- moment-timezone (for date parsing)

---

Backend implementation complete and tested ✅
Ready for frontend integration!