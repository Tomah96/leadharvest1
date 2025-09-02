# Frontend Implementation Guide for Message Templates

## Overview
This guide provides detailed implementation instructions for the Frontend Claude to add message template functionality to the LeadHarvest UI.

## Component Architecture

```
/app/settings/templates/
├── page.tsx                 # Main settings page
├── TemplateEditor.tsx       # Editor with variable insertion
├── TemplatePreview.tsx      # Live preview panel
├── VariablePalette.tsx      # Variable buttons/dropdown
├── templateTypes.ts         # TypeScript definitions
└── useTemplates.ts         # Custom hooks for state management
```

## 1. TypeScript Definitions

### File: `/frontend/src/app/settings/templates/templateTypes.ts`

```typescript
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'initial_contact' | 'follow_up' | 'tour_confirmation' | 'custom';
  template: string;
  variables_used: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TourAvailability {
  slots: TourSlot[];
  preferences: TourPreferences;
  raw_text?: string;
}

export interface TourSlot {
  date: string;
  time?: string;
  timezone?: string;
  duration?: number;
  status?: 'proposed' | 'confirmed' | 'cancelled';
  confidence?: number;
}

export interface TourPreferences {
  preferred_days: string[];
  preferred_times: string[];
  avoid_times?: string[];
}

export interface TemplateVariable {
  field: string;
  description: string;
  category: 'lead_info' | 'property' | 'acknowledgment' | 'questions' | 'agent';
  example?: string;
}

export interface ProcessedTemplate {
  processed_content: string;
  missing_variables: string[];
  substitutions: Record<string, string>;
}
```

## 2. Main Templates Page

### File: `/frontend/src/app/settings/templates/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Save, Plus, FileText, Mail, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api-client';
import TemplateEditor from './TemplateEditor';
import TemplatePreview from './TemplatePreview';
import { MessageTemplate } from './templateTypes';

export default function TemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [templateType, setTemplateType] = useState<MessageTemplate['type']>('initial_contact');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.templates.getAll();
      return response.data as MessageTemplate[];
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: Partial<MessageTemplate>) => {
      if (selectedTemplate?.id && !isCreating) {
        return api.templates.update(selectedTemplate.id, data);
      } else {
        return api.templates.create(data);
      }
    },
    onSuccess: () => {
      toast({
        title: isCreating ? 'Template created' : 'Template saved',
        description: 'Your template has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: 'Error saving template',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.templates.delete(id);
    },
    onSuccess: () => {
      toast({
        title: 'Template deleted',
        description: 'The template has been deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSelectedTemplate(null);
      setTemplateContent('');
    }
  });

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setTemplateContent(template.template);
    setTemplateType(template.type);
    setIsCreating(false);
  };

  const handleNewTemplate = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
    setTemplateContent(getDefaultTemplate(templateType));
  };

  const handleSave = () => {
    const name = isCreating 
      ? prompt('Enter a name for this template:')
      : selectedTemplate?.name;

    if (!name) return;

    const variables = extractVariables(templateContent);
    
    saveTemplateMutation.mutate({
      name,
      type: templateType,
      template: templateContent,
      variables_used: variables
    });
  };

  const getDefaultTemplate = (type: MessageTemplate['type']) => {
    const templates = {
      initial_contact: `Hello {first_name},

Thank you for your interest in {property_address}.

{acknowledgment_text} {tour_availability_ack}

{missing_info} {tour_question}

To qualify for this property, applicants must have:
- Income of 3x the monthly rent
- Credit score of 650+
- Valid references from previous landlords

Please let me know if you have any questions.

Best regards,
{agent_name}
{agent_company}
{agent_phone}`,
      follow_up: `Hi {first_name},

I wanted to follow up on your inquiry about {property_address}.

Are you still interested in scheduling a viewing? {tour_question}

{missing_info}

Looking forward to hearing from you.

Best regards,
{agent_name}`,
      tour_confirmation: `Hi {first_name},

This confirms your viewing appointment for {property_address}.

Date: {tour_dates}
Time: [TIME]

Please bring a photo ID. I'll meet you at the property.

If you need to reschedule, please let me know.

Best regards,
{agent_name}`,
      custom: `Hi {first_name},

{property_address}

{acknowledgment_text}
{missing_info}

Best regards,
{agent_name}`
    };
    return templates[type];
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Message Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage templates for lead communication
          </p>
        </div>
        <Button onClick={handleNewTemplate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : (
                <div className="divide-y">
                  {templates?.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedTemplate?.id === template.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {template.type === 'initial_contact' && <Mail className="w-4 h-4" />}
                        {template.type === 'follow_up' && <MessageSquare className="w-4 h-4" />}
                        {template.type === 'tour_confirmation' && <FileText className="w-4 h-4" />}
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{template.type.replace('_', ' ')}</span>
                      {template.is_default && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor and Preview */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Template Editor</CardTitle>
                <CardDescription>
                  Edit your template and insert variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateEditor
                  content={templateContent}
                  onChange={setTemplateContent}
                  templateType={templateType}
                  onTypeChange={setTemplateType}
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saveTemplateMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                  </Button>
                  {selectedTemplate && !isCreating && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this template?')) {
                          deleteTemplateMutation.mutate(selectedTemplate.id);
                        }
                      }}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  See how your template looks with sample data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplatePreview template={templateContent} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 3. Template Editor Component

### File: `/frontend/src/app/settings/templates/TemplateEditor.tsx`

```tsx
import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VariablePalette from './VariablePalette';
import { MessageTemplate } from './templateTypes';

interface TemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
  templateType: MessageTemplate['type'];
  onTypeChange: (type: MessageTemplate['type']) => void;
}

export default function TemplateEditor({
  content,
  onChange,
  templateType,
  onTypeChange
}: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + `{${variable}}` + content.slice(end);
    
    onChange(newContent);
    
    // Reset cursor position after React re-render
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variable.length + 2; // +2 for the curly braces
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const templateTypes = [
    { value: 'initial_contact', label: 'Initial Contact' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'tour_confirmation', label: 'Tour Confirmation' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="space-y-4">
      {/* Template Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Template Type</label>
        <Select value={templateType} onValueChange={(value) => onTypeChange(value as MessageTemplate['type'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templateTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Variable Palette */}
      <VariablePalette onInsert={insertVariable} />

      {/* Template Content Editor */}
      <div>
        <label className="block text-sm font-medium mb-2">Template Content</label>
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm min-h-[400px] p-4"
          placeholder="Enter your template here... Use {variable_name} for dynamic content"
          onDrop={(e) => {
            e.preventDefault();
            const variable = e.dataTransfer.getData('text/plain');
            if (variable) {
              insertVariable(variable);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
          }}
        />
        <p className="text-xs text-gray-500 mt-2">
          Tip: Click variables above to insert them, or type { to see suggestions
        </p>
      </div>
    </div>
  );
}
```

## 4. Variable Palette Component

### File: `/frontend/src/app/settings/templates/VariablePalette.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TemplateVariable } from './templateTypes';

interface VariablePaletteProps {
  onInsert: (variable: string) => void;
}

const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Lead Information
  { field: 'first_name', description: "Lead's first name", category: 'lead_info', example: 'John' },
  { field: 'last_name', description: "Lead's last name", category: 'lead_info', example: 'Smith' },
  { field: 'full_name', description: "Lead's full name", category: 'lead_info', example: 'John Smith' },
  { field: 'email', description: "Lead's email address", category: 'lead_info', example: 'john@example.com' },
  { field: 'phone', description: "Lead's phone number", category: 'lead_info', example: '(555) 123-4567' },
  
  // Property Information
  { field: 'property_address', description: 'Property address', category: 'property', example: '123 Main St' },
  { field: 'move_in_date', description: 'Desired move-in date', category: 'property', example: 'September 1, 2025' },
  { field: 'inquiry_date', description: 'Date of inquiry', category: 'property', example: 'August 27, 2025' },
  { field: 'income', description: 'Annual income', category: 'property', example: '$75,000' },
  { field: 'credit_score', description: 'Credit score or range', category: 'property', example: '720-780' },
  { field: 'occupants', description: 'Number of occupants', category: 'property', example: '2' },
  { field: 'pets', description: 'Pet information', category: 'property', example: '1 cat' },
  { field: 'lease_length', description: 'Desired lease length', category: 'property', example: '12 months' },
  
  // Smart Sections
  { field: 'acknowledgment_text', description: 'Auto-generated acknowledgment of provided info', category: 'acknowledgment' },
  { field: 'tour_availability_ack', description: 'Acknowledgment of tour dates provided', category: 'acknowledgment' },
  { field: 'tour_question', description: 'Smart question about tour availability', category: 'questions' },
  { field: 'missing_info', description: 'List of missing required information', category: 'questions' },
  { field: 'qualification_criteria', description: 'Property qualification requirements', category: 'questions' },
  
  // Agent Information
  { field: 'agent_name', description: "Agent's full name", category: 'agent', example: 'Toma Holovatsky' },
  { field: 'agent_company', description: 'Company name', category: 'agent', example: 'RE/MAX Plus' },
  { field: 'agent_phone', description: 'Agent phone number', category: 'agent', example: '(215) 280-1874' },
  { field: 'agent_email', description: 'Agent email', category: 'agent', example: 'toma@remax.com' },
  { field: 'agent_signature', description: 'Full signature block', category: 'agent' }
];

export default function VariablePalette({ onInsert }: VariablePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Variables' },
    { value: 'lead_info', label: 'Lead Info' },
    { value: 'property', label: 'Property' },
    { value: 'acknowledgment', label: 'Acknowledgment' },
    { value: 'questions', label: 'Questions' },
    { value: 'agent', label: 'Agent Info' }
  ];

  const filteredVariables = TEMPLATE_VARIABLES.filter(variable => {
    const matchesSearch = variable.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || variable.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Template Variables</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48 h-8 text-sm"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 text-sm border rounded px-2"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        <TooltipProvider>
          {filteredVariables.map((variable) => (
            <Tooltip key={variable.field}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onInsert(variable.field)}
                  className="flex items-center justify-between p-2 text-sm bg-white border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', variable.field);
                  }}
                >
                  <span className="font-mono text-xs text-blue-600 group-hover:text-blue-700">
                    {`{${variable.field}}`}
                  </span>
                  <Info className="w-3 h-3 text-gray-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-semibold">{variable.field}</p>
                <p className="text-sm">{variable.description}</p>
                {variable.example && (
                  <p className="text-xs text-gray-500 mt-1">Example: {variable.example}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Click to insert at cursor position, or drag into the editor
      </p>
    </div>
  );
}
```

## 5. Template Preview Component

### File: `/frontend/src/app/settings/templates/TemplatePreview.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { ProcessedTemplate } from './templateTypes';

interface TemplatePreviewProps {
  template: string;
  leadId?: string;
}

export default function TemplatePreview({ template, leadId }: TemplatePreviewProps) {
  const [preview, setPreview] = useState<ProcessedTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generatePreview = async () => {
      if (!template) {
        setPreview(null);
        return;
      }

      setLoading(true);
      try {
        const response = await api.templates.preview({
          template,
          leadData: leadId ? undefined : getSampleLeadData()
        });
        setPreview(response.data);
      } catch (error) {
        console.error('Preview generation failed:', error);
        // Fallback to client-side preview
        setPreview({
          processed_content: processTemplateLocally(template),
          missing_variables: [],
          substitutions: {}
        });
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(generatePreview, 500);
    return () => clearTimeout(debounce);
  }, [template, leadId]);

  const getSampleLeadData = () => ({
    first_name: 'John',
    last_name: 'Smith',
    full_name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    property_address: '123 Main Street, Apt 4B',
    move_in_date: '2025-09-01',
    income: 75000,
    credit_score: '720-780',
    occupants: 2,
    pets: '1 cat',
    lease_length: 12,
    tour_availability: {
      slots: [
        { date: '2025-08-30', time: '14:00' },
        { date: '2025-08-31', time: 'morning' }
      ]
    },
    agent_name: 'Toma Holovatsky',
    agent_company: 'RE/MAX Plus',
    agent_phone: '(215) 280-1874',
    agent_email: 't.holovatskyy@gmail.com'
  });

  const processTemplateLocally = (template: string) => {
    const sampleData = getSampleLeadData();
    let processed = template;

    // Simple variable replacement for preview
    const replacements: Record<string, string> = {
      first_name: sampleData.first_name,
      last_name: sampleData.last_name,
      full_name: sampleData.full_name,
      email: sampleData.email,
      phone: sampleData.phone,
      property_address: sampleData.property_address,
      move_in_date: 'September 1, 2025',
      income: `$${sampleData.income.toLocaleString()}`,
      credit_score: sampleData.credit_score,
      occupants: sampleData.occupants.toString(),
      pets: sampleData.pets,
      lease_length: `${sampleData.lease_length} months`,
      agent_name: sampleData.agent_name,
      agent_company: sampleData.agent_company,
      agent_phone: sampleData.agent_phone,
      agent_email: sampleData.agent_email,
      
      // Smart sections (simplified for preview)
      acknowledgment_text: 'I see that you have annual income of $75,000, credit score of 720-780, 2 occupants, and 1 cat.',
      tour_availability_ack: 'I see you\'re available to tour on August 30th at 2pm or August 31st morning.',
      tour_question: 'Would either of these times work for you?',
      missing_info: 'Could you please confirm your preferred move-in date?',
      qualification_criteria: 'To qualify, applicants must have a 650+ credit score and 3x the rent in verifiable income.',
      agent_signature: `Best regards,\n${sampleData.agent_name}\n${sampleData.agent_company}\n${sampleData.agent_phone}`
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      processed = processed.replace(regex, value);
    });

    // Highlight any remaining variables
    processed = processed.replace(/\{([^}]+)\}/g, '<mark class="bg-yellow-200">MISSING: $1</mark>');

    return processed;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="text-gray-500 text-center py-8">
        Enter template content to see preview
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Content */}
      <Card className="p-4 bg-gray-50">
        <div 
          className="prose prose-sm max-w-none whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ 
            __html: preview.processed_content.replace(/\n/g, '<br />') 
          }}
        />
      </Card>

      {/* Variable Status */}
      {preview.missing_variables.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-600">Missing Variables:</p>
          <div className="flex flex-wrap gap-2">
            {preview.missing_variables.map((variable) => (
              <Badge key={variable} variant="destructive" className="text-xs">
                {variable}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Sample Data Notice */}
      <p className="text-xs text-gray-500 italic">
        This preview uses sample data. Actual content will vary based on lead information.
      </p>
    </div>
  );
}
```

## 6. ConversationWindow Integration

### Update: `/frontend/src/components/conversations/ConversationWindow.tsx`

Add template dropdown and application logic:

```tsx
// Add to imports
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';

// Add to component state
const [templates, setTemplates] = useState<MessageTemplate[]>([]);
const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
const [loadingTemplate, setLoadingTemplate] = useState(false);

// Add useEffect to load templates
useEffect(() => {
  loadTemplates();
}, []);

const loadTemplates = async () => {
  try {
    const response = await api.templates.getAll();
    setTemplates(response.data);
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
};

// Add template application function
const applyTemplate = async (templateId: string) => {
  if (!templateId || !leadId) return;
  
  setLoadingTemplate(true);
  try {
    const response = await api.templates.applyToLead(templateId, leadId);
    setComposeText(response.data.processed_content);
    
    // Show any missing variables
    if (response.data.missing_variables.length > 0) {
      toast({
        title: 'Template applied with missing information',
        description: `Missing: ${response.data.missing_variables.join(', ')}`,
        variant: 'warning'
      });
    }
  } catch (error) {
    console.error('Failed to apply template:', error);
    toast({
      title: 'Failed to apply template',
      description: error.message,
      variant: 'destructive'
    });
  } finally {
    setLoadingTemplate(false);
    setSelectedTemplateId('');
  }
};

// Add to JSX above the compose textarea
<div className="flex items-center gap-2 mb-2">
  <Select 
    value={selectedTemplateId} 
    onValueChange={(value) => {
      setSelectedTemplateId(value);
      if (value) applyTemplate(value);
    }}
  >
    <SelectTrigger className="w-64">
      <SelectValue placeholder="Select a template...">
        {selectedTemplateId ? (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {templates.find(t => t.id === selectedTemplateId)?.name}
          </div>
        ) : (
          <span className="text-gray-500">Select a template...</span>
        )}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">None</SelectItem>
      {templates.map((template) => (
        <SelectItem key={template.id} value={template.id}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <div>
              <div className="font-medium">{template.name}</div>
              <div className="text-xs text-gray-500">
                {template.type.replace('_', ' ')}
              </div>
            </div>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {loadingTemplate && (
    <span className="text-sm text-gray-500">Applying template...</span>
  )}
</div>
```

## 7. API Client Updates

### Update: `/frontend/src/lib/api-client.ts`

```typescript
// Add template methods to API client
templates: {
  getAll: () => apiRequest('/api/templates'),
  
  get: (id: string) => apiRequest(`/api/templates/${id}`),
  
  create: (data: Partial<MessageTemplate>) => 
    apiRequest('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  update: (id: string, data: Partial<MessageTemplate>) =>
    apiRequest(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  delete: (id: string) =>
    apiRequest(`/api/templates/${id}`, {
      method: 'DELETE'
    }),
  
  preview: (data: { template: string; leadData?: any }) =>
    apiRequest('/api/templates/preview', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  applyToLead: (templateId: string, leadId: string) =>
    apiRequest(`/api/templates/${templateId}/apply/${leadId}`, {
      method: 'POST'
    })
}
```

## Testing Guidelines

### Component Testing Example
```tsx
// File: /frontend/src/app/settings/templates/__tests__/TemplateEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateEditor from '../TemplateEditor';

describe('TemplateEditor', () => {
  test('inserts variable at cursor position', () => {
    const onChange = jest.fn();
    const { container } = render(
      <TemplateEditor
        content="Hello "
        onChange={onChange}
        templateType="initial_contact"
        onTypeChange={() => {}}
      />
    );

    // Find and click a variable button
    const firstNameBtn = screen.getByText('{first_name}');
    fireEvent.click(firstNameBtn);

    // Check that onChange was called with inserted variable
    expect(onChange).toHaveBeenCalledWith('Hello {first_name}');
  });

  test('supports drag and drop', () => {
    // Test drag and drop functionality
  });
});
```

## Common Pitfalls to Avoid

1. **State management** - Use React Query for server state
2. **Debounce preview** - Don't call API on every keystroke
3. **Cursor position** - Maintain after variable insertion
4. **Error handling** - Show user-friendly messages
5. **Loading states** - Show skeletons, not blank screens
6. **Responsive design** - Test on mobile screens
7. **Dark mode** - Ensure all components support it
8. **Accessibility** - Add ARIA labels and keyboard navigation

## Success Criteria Checklist

- [ ] Settings page loads and displays templates
- [ ] Can create, edit, delete templates
- [ ] Variable insertion works (click and drag)
- [ ] Live preview updates as you type
- [ ] ConversationWindow shows template dropdown
- [ ] Templates apply correctly with lead data
- [ ] Missing variables are highlighted
- [ ] Responsive on all screen sizes
- [ ] Dark mode works correctly
- [ ] No console errors
- [ ] All tests passing