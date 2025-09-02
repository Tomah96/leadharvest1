'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { ProcessedTemplate } from './templateTypes';

interface TemplatePreviewProps {
  template: string;
  leadId?: string;
}

export default function TemplatePreview({ template, leadId }: TemplatePreviewProps) {
  const [preview, setPreview] = useState<ProcessedTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('[TemplatePreview] Preview state:', preview);
  }, [preview]);

  useEffect(() => {
    const generatePreview = async () => {
      if (!template) {
        setPreview(null);
        return;
      }

      setLoading(true);
      try {
        // Try to use server-side preview if available
        const response = await api.templates.preview({
          template,
          leadData: leadId ? undefined : getSampleLeadData()
        });
        // Ensure we have the right structure
        if (response?.data?.data) {
          setPreview(response.data.data);
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (error) {
        // Fallback to client-side preview
        console.log('[TemplatePreview] Using client-side preview due to error:', error);
        setPreview({
          processed_content: processTemplateLocally(template),
          missing_variables: [],
          substitutions: {}
        });
      } finally {
        setLoading(false);
      }
    };

    // Debounce the preview generation
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
    inquiry_date: '2025-08-27',
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

    // Format dates nicely
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    // Simple variable replacement for preview
    const replacements: Record<string, string> = {
      first_name: sampleData.first_name,
      last_name: sampleData.last_name,
      full_name: sampleData.full_name,
      email: sampleData.email,
      phone: sampleData.phone,
      property_address: sampleData.property_address,
      move_in_date: formatDate(sampleData.move_in_date),
      inquiry_date: formatDate(sampleData.inquiry_date),
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
      acknowledgment_text: 'I see that you have an annual income of $75,000, credit score of 720-780, 2 occupants, and 1 cat.',
      tour_availability_ack: 'I see you\'re available to tour on August 30th at 2pm or August 31st morning.',
      tour_question: 'Would either of these times work for you, or would you prefer a different date/time?',
      missing_info: 'To proceed with your application, I\'ll need the following information:\n- Preferred move-in date\n- Current address and landlord contact',
      qualification_criteria: '• Income of 3x the monthly rent ($72,000+ annually)\n• Credit score of 650+\n• Valid references from previous landlords',
      agent_signature: `Best regards,\n${sampleData.agent_name}\n${sampleData.agent_company}\n${sampleData.agent_phone}`
    };

    // Replace all variables
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      processed = processed.replace(regex, value);
    });

    // Highlight any remaining unreplaced variables
    processed = processed.replace(/\{([^}]+)\}/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1">MISSING: $1</mark>');

    return processed;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!preview || !template) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
        Enter template content to see preview
      </div>
    );
  }

  // Safety check for processed_content
  const missingVars = preview?.processed_content?.match(/MISSING: ([^<]+)/g)?.map(m => m.replace('MISSING: ', '')) || [];
  console.log('[TemplatePreview] Missing vars check - preview:', preview, 'missingVars:', missingVars);

  return (
    <div className="space-y-4">
      {/* Preview Content */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div 
          className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-gray-900 dark:text-gray-100"
          dangerouslySetInnerHTML={{ 
            __html: preview?.processed_content?.replace(/\n/g, '<br />') || ''
          }}
        />
      </div>

      {/* Variable Status */}
      {missingVars.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Missing Variables:</p>
          <div className="flex flex-wrap gap-2">
            {missingVars.map((variable, index) => (
              <span 
                key={index} 
                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded"
              >
                {variable}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sample Data Notice */}
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        This preview uses sample data. Actual content will vary based on lead information.
      </p>
    </div>
  );
}