'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, FileText, Mail, MessageSquare, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import TemplateEditor from './TemplateEditor';
import TemplatePreview from './TemplatePreview';
import { MessageTemplate } from './templateTypes';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [templateType, setTemplateType] = useState<MessageTemplate['type']>('initial_contact');
  const [templateName, setTemplateName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    console.log('[TemplatesPage] Starting to load templates...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.templates.getAll();
      console.log('[TemplatesPage] API response received:', {
        status: response.status,
        hasData: !!response.data,
        dataType: typeof response.data,
        success: response.data?.success,
        dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 'not-array'
      });
      
      // The response.data contains { success: boolean, data: MessageTemplate[] }
      const templatesData = response?.data?.data;
      
      if (!Array.isArray(templatesData)) {
        console.error('[TemplatesPage] Expected array but got:', {
          type: typeof templatesData,
          value: templatesData,
          fullResponse: response.data
        });
        setTemplates([]);
        return;
      }
      
      console.log(`[TemplatesPage] Successfully loaded ${templatesData.length} templates`);
      setTemplates(templatesData);
    } catch (error) {
      console.error('[TemplatesPage] Failed to load templates:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to load templates. Please check your connection.');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setTemplateContent(template.template);
    setTemplateType(template.type);
    setTemplateName(template.name);
    setIsCreating(false);
  };

  const handleNewTemplate = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateContent(getDefaultTemplate(templateType));
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      const variables = extractVariables(templateContent);
      
      if (selectedTemplate?.id && !isCreating) {
        // Update existing
        await api.templates.update(selectedTemplate.id, {
          name: templateName,
          type: templateType,
          template: templateContent,
          variables_used: variables
        });
      } else {
        // Create new
        const response = await api.templates.create({
          name: templateName,
          type: templateType,
          template: templateContent,
          variables_used: variables
        });
        setSelectedTemplate(response.data.data);
      }
      
      await loadTemplates();
      setIsCreating(false);
      alert(isCreating ? 'Template created successfully' : 'Template updated successfully');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate?.id || !confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await api.templates.delete(selectedTemplate.id);
      await loadTemplates();
      setSelectedTemplate(null);
      setTemplateContent('');
      setTemplateName('');
      alert('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
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

  const getIcon = (type: MessageTemplate['type']) => {
    switch (type) {
      case 'initial_contact':
        return <Mail className="w-4 h-4" />;
      case 'follow_up':
        return <MessageSquare className="w-4 h-4" />;
      case 'tour_confirmation':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Message Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage templates for lead communication
          </p>
        </div>
        <button
          onClick={handleNewTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Templates</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
              ) : !templates || !Array.isArray(templates) || templates.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No templates yet</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(templates) && templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedTemplate?.id === template.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getIcon(template.type)}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{template.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {template.type.replace('_', ' ')}
                      </span>
                      {template.is_default && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor and Preview */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Template Editor</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Edit your template and insert variables
                </p>
              </div>
              <div className="p-4">
                {/* Template Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter template name..."
                  />
                </div>

                <TemplateEditor
                  content={templateContent}
                  onChange={setTemplateContent}
                  templateType={templateType}
                  onTypeChange={setTemplateType}
                />
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !templateName.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </button>
                  {selectedTemplate && !isCreating && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Preview</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  See how your template looks with sample data
                </p>
              </div>
              <div className="p-4">
                <TemplatePreview template={templateContent} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}