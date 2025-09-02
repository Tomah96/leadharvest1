# Conversation Window Integration Guide

## ✅ Current Status: READY TO USE

The conversation window is **already fully integrated** with the template system!

## What's Already Working

### Frontend (`ConversationWindow.tsx`)
- ✅ Template dropdown with all available templates
- ✅ Apply template button
- ✅ Template caching for performance
- ✅ Missing variables alert
- ✅ Lazy loading for better performance
- ✅ Email/SMS tab switching

### Backend (`templateRoutes.js`)
- ✅ `POST /api/templates/:id/apply/:leadId` endpoint
- ✅ Variable substitution with lead data
- ✅ Smart sections (acknowledgments, missing info, tour questions)
- ✅ Agent information from config

### Integration Points
- ✅ ConversationWindow imported in lead details page
- ✅ Template selection dropdown in UI
- ✅ Apply template fills compose box
- ✅ Send message saves to conversations

## How to Use It

### 1. Navigate to Lead Details
```
http://localhost:3003/leads/[id]
```

### 2. Conversation Window Location
The conversation window appears below the lead information cards.

### 3. Using Templates

1. **Select a Template**: Click the template dropdown (FileText icon)
2. **Choose Template**: Select from available templates
3. **Apply**: Template content appears in compose box with variables filled
4. **Edit if Needed**: Make any manual adjustments
5. **Send**: Click send to save the message

## Testing the Integration

### Test via UI
1. Go to: http://localhost:3003/leads/682
2. Look for the conversation window below lead details
3. Click the template icon (FileText)
4. Select "Default Initial Contact"
5. Watch the compose box populate with personalized content

### Test via API
```bash
# Apply template to lead
curl -X POST http://localhost:3001/api/templates/[template-id]/apply/[lead-id]

# Example with real IDs
curl -X POST http://localhost:3001/api/templates/1178e3c3-45fb-430e-aa0a-df9d2f0961ec/apply/682
```

## Template Variables Available

### Basic Information
- `{first_name}` - Lead's first name
- `{last_name}` - Lead's last name
- `{property_address}` - Property they inquired about
- `{email}` - Lead's email
- `{phone}` - Lead's phone (formatted)

### Smart Sections
- `{acknowledgment_text}` - Acknowledges provided info (income, credit, etc.)
- `{missing_info}` - Asks for missing required fields
- `{tour_availability_ack}` - Acknowledges tour availability
- `{tour_question}` - Asks about tour times
- `{qualification_criteria}` - Standard rental requirements

### Agent Information
- `{agent_name}` - From config/agentDefaults.js
- `{agent_company}` - Company name
- `{agent_phone}` - Agent phone
- `{agent_email}` - Agent email

## Example Output

When applied to Maryorie's lead:
```
Hello, Maryorie!
Hope you are well

This is Toma Holovatsky with RE/MAX Plus. Thank you for your inquiry about 5914 Tackawanna St.

I see that you have credit score range of 660-719, move-in date of Thursday, September 30, and 1 occupant. 

Could you please provide your approximate annual income and whether you have any pets? 
When would be a good time for you to tour the property? 

To qualify for this property, applicants must have:
• Income of 3x the monthly rent
• Credit score of 650+
• Valid references from previous landlords.

Thank you!

Best,
Toma Holovatsky with RE/MAX Plus
```

## Performance Features

### Template Caching
Templates are cached in localStorage for 1 hour to reduce API calls:
```javascript
localStorage.getItem('templates_cache')
```

### Lazy Loading
- Messages load 100ms after component mounts
- Templates load from cache first, then API
- Prevents blocking the lead page render

## Troubleshooting

### Templates Not Loading
```bash
# Check backend is running
curl http://localhost:3001/api/templates

# Check CORS for your port
curl -H "Origin: http://localhost:3003" http://localhost:3001/api/templates
```

### Template Not Applying
```bash
# Test the apply endpoint directly
curl -X POST http://localhost:3001/api/templates/[id]/apply/[lead-id]
```

### Missing Variables
Check the lead has required fields:
- first_name
- property_address
- Other fields used in template

## File Locations

### Frontend
- Component: `/frontend/src/components/conversations/ConversationWindow.tsx`
- Lead Page: `/frontend/src/app/leads/[id]/page.tsx`
- API Client: `/frontend/src/lib/api-client.ts`

### Backend
- Routes: `/backend/src/routes/templateRoutes.js`
- Service: `/backend/src/services/templateService.js`
- Config: `/backend/src/config/agentDefaults.js`

## Next Steps

The conversation window is fully integrated! You can:

1. **Create More Templates**: Go to Settings → Templates
2. **Customize Agent Info**: Edit `/backend/src/config/agentDefaults.js`
3. **Add More Variables**: Extend templateService.js
4. **Style the UI**: Modify ConversationWindow.tsx styling

---

**Status**: ✅ Feature Complete and Working!