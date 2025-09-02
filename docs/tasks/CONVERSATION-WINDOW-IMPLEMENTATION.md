# Conversation Window Implementation Plan
**Date**: 2025-08-27  
**Priority**: P0 - Critical UX Improvement
**User Requirements**: 1B, 2A, 3A, 4B, 5A, 6B, 7B, 8A

## User's Design Decisions
1. **Layout**: Top-bottom (Lead info compact at top, Conversation full width below)
2. **Tabs**: Separate Email/Text tabs
3. **Inquiry**: Shows as first message in conversation 
4. **Messages**: Include Reply button per message
5. **Compose**: Fixed at bottom of conversation
6. **Lead Info**: Show key fields (name, phone, email, status, property, move-in)
7. **Quick Actions**: Move to dropdown menu (⋮)
8. **Date Format**: Absolute only "Aug 27, 2025 at 4:37 PM"

## Visual Layout Mockup
```
┌─────────────────────────────────────────────────────────┐
│ < Back to Leads                                    ⋮    │
├─────────────────────────────────────────────────────────┤
│ LEAD INFO (Compact)                                     │
│ Maryorie Castillo • (201) 814-3838 • Status: New       │
│ 5914 Tackawanna St • Move-in: Aug 28, 2025             │
├─────────────────────────────────────────────────────────┤
│ [Email] [Text]                                          │
├─────────────────────────────────────────────────────────┤
│ CONVERSATION                                            │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ Initial Inquiry - Aug 27, 2025 at 4:37 PM       │    │
│ │ "I'm interested in your property and would      │    │
│ │ like to move forward. Can you send me an        │    │
│ │ application for this property?"                 │    │
│ │                                         [Reply] │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ You - Aug 27, 2025 at 5:15 PM                  │    │
│ │ "Thanks for your interest! I've sent the        │    │
│ │ application to your email..."                   │    │
│ │                                         [Reply] │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ COMPOSE MESSAGE                                         │
│ [Type your message...]                                  │
│                                      [Send Email]       │
└─────────────────────────────────────────────────────────┘
```

## Task Assignments

### Claude 2 (Backend) - 1.5 hours

#### Task 1: Fix Remaining Parser Issues (30 min)
**File**: `/backend/src/parsers/zillowParser.js`

```javascript
// Line ~325 - Fix pets to return null properly
pets: petsMatch ? 
  (petsMatch[1].trim().toLowerCase() === 'not answered' || 
   petsMatch[1].trim() === 'N/A' ? null : petsMatch[1].trim()) 
  : null,

// Line ~345 - Fix occupants to return null
occupants: occupantsMatch && occupantsMatch[1] ? 
  parseInt(occupantsMatch[1]) : null,

// Line ~370 - Store credit range in metadata
metadata: {
  credit_score_range: creditMatch ? creditMatch[1] : null,
  original_credit_text: creditMatch ? creditMatch[0] : null
}
```

#### Task 2: Create Conversation Seeds (30 min)
**File**: `/backend/src/services/conversationService.js`

Add method to create initial inquiry message when lead is created:
```javascript
async createInitialInquiry(leadId, inquiryText, inquiryDate) {
  if (!inquiryText || inquiryText.trim() === '') return;
  
  return await this.createMessage({
    lead_id: leadId,
    type: 'email',
    direction: 'inbound',
    content: inquiryText,
    created_at: inquiryDate || new Date(),
    metadata: { 
      is_initial_inquiry: true,
      source: 'zillow_import' 
    }
  });
}
```

#### Task 3: Update Lead Service (30 min)
**File**: `/backend/src/services/leadService.js`

Call conversation service after lead creation:
```javascript
// In createOrUpdateLead method, after lead is created/updated:
if (isNew && leadData.notes) {
  await conversationService.createInitialInquiry(
    lead.id,
    leadData.notes,
    leadData.inquiry_date
  );
}
```

### Claude 3 (Frontend) - 2 hours

#### Task 1: Fix Date Display (15 min)
**File**: `/frontend/src/app/leads/[id]/page.tsx`

Replace all relative date logic with absolute format:
```typescript
const formatInquiryDate = (date: string | null) => {
  if (!date) return 'Not provided';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  // Format: Aug 27, 2025 at 4:37 PM
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
```

#### Task 2: Redesign Layout (45 min)
**File**: `/frontend/src/app/leads/[id]/page.tsx`

New structure:
```tsx
return (
  <div className="max-w-6xl mx-auto">
    {/* Header with back button and dropdown */}
    <div className="flex justify-between mb-4">
      <Link href="/leads">← Back to Leads</Link>
      <DropdownMenu>
        <DropdownMenuTrigger>⋮</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleCall}>Call</DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmail}>Email</DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    {/* Compact Lead Info */}
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-bold">{lead.first_name} {lead.last_name}</h1>
        <span className="text-gray-600">•</span>
        <a href={`tel:${lead.phone}`} className="text-blue-600">{formatPhone(lead.phone)}</a>
        <span className="text-gray-600">•</span>
        <StatusBadge status={lead.status} />
      </div>
      <div className="mt-2 text-gray-600">
        {lead.property_address} • Move-in: {formatInquiryDate(lead.move_in_date)}
      </div>
    </div>

    {/* Conversation Tabs */}
    <ConversationWindow 
      leadId={lead.id}
      initialInquiry={{
        content: lead.notes,
        date: lead.inquiry_date
      }}
    />
  </div>
);
```

#### Task 3: Create ConversationWindow Component (1 hour)
**File**: `/frontend/src/components/conversations/ConversationWindow.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Reply } from 'lucide-react';

interface ConversationWindowProps {
  leadId: number;
  initialInquiry?: {
    content: string | null;
    date: string | null;
  };
}

export function ConversationWindow({ leadId, initialInquiry }: ConversationWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'email' | 'text'>('email');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [composeText, setComposeText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [leadId, activeTab]);

  const loadMessages = async () => {
    setLoading(true);
    const response = await apiClient.conversations.getByLeadId(leadId, {
      type: activeTab
    });
    setMessages(response.messages);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!composeText.trim()) return;
    
    await apiClient.conversations.addMessage(leadId, {
      type: activeTab,
      direction: 'outbound',
      content: composeText
    });
    
    setComposeText('');
    setReplyTo(null);
    loadMessages();
  };

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'email' | 'text')}>
        <TabsList className="w-full justify-start border-b">
          <TabsTrigger value="email" className="flex gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="text" className="flex gap-2">
            <MessageSquare className="w-4 h-4" />
            Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="p-4">
          <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
            {/* Initial Inquiry - Always First */}
            {initialInquiry?.content && activeTab === 'email' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-blue-900">Initial Inquiry</span>
                  <span className="text-sm text-gray-600">
                    {formatMessageDate(initialInquiry.date || new Date().toISOString())}
                  </span>
                </div>
                <p className="text-gray-800 mb-2">{initialInquiry.content}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReplyTo(-1)}
                  className="flex gap-1"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </Button>
              </div>
            )}

            {/* Other Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.direction === 'inbound' ? 'bg-gray-50' : 'bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">
                    {message.direction === 'inbound' ? 'Lead' : 'You'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatMessageDate(message.created_at)}
                  </span>
                </div>
                <p className="text-gray-800 mb-2">{message.content}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReplyTo(message.id)}
                  className="flex gap-1"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </Button>
              </div>
            ))}

            {messages.length === 0 && !initialInquiry?.content && (
              <p className="text-center text-gray-500 py-8">
                No {activeTab} messages yet
              </p>
            )}
          </div>

          {/* Compose Area - Fixed at Bottom */}
          <div className="border-t pt-4">
            {replyTo && (
              <div className="mb-2 text-sm text-gray-600">
                Replying to message... 
                <button onClick={() => setReplyTo(null)} className="ml-2 text-blue-600">
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder={`Type your ${activeTab} message...`}
                className="flex-1"
                rows={3}
              />
              <Button onClick={sendMessage} className="self-end">
                Send {activeTab === 'email' ? 'Email' : 'Text'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Implementation Guidelines

### DO:
- Keep it simple and functional
- Use existing API endpoints
- Focus on core functionality first
- Test with real data
- Ensure mobile responsiveness

### DON'T:
- Over-engineer the solution
- Add unnecessary features
- Create complex state management
- Implement features not requested
- Change existing working code unnecessarily

## Success Criteria
1. ✅ Inquiry date shows as "Aug 27, 2025 at 4:37 PM" (no relative time)
2. ✅ Lead info is compact at top
3. ✅ Conversation window takes full width below
4. ✅ Email and Text are separate tabs
5. ✅ Initial inquiry shows as first message
6. ✅ Reply buttons work per message
7. ✅ Compose box is fixed at bottom
8. ✅ Quick actions moved to dropdown menu

## Testing Steps
1. Navigate to lead details page
2. Verify date format is absolute only
3. Check initial inquiry appears first
4. Test tab switching between Email/Text
5. Send a test message
6. Verify reply functionality
7. Check mobile responsiveness

## Timeline
- Backend: 1.5 hours
- Frontend: 2 hours
- Testing: 30 minutes
- **Total**: 4 hours