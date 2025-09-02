'use client';

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Reply, Send, FileText, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Message } from '@/types';
import type { MessageTemplate } from '@/app/settings/templates/templateTypes';

interface ConversationWindowProps {
  leadId: string | number;
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
  const [loading, setLoading] = useState(false); // UI updates: larger compose box
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [hasLoadedTemplates, setHasLoadedTemplates] = useState(false);

  // Lazy load messages only when component becomes visible
  useEffect(() => {
    // Small delay to allow the lead page to render first
    const timer = setTimeout(() => {
      if (!hasLoadedMessages) {
        loadMessages();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [leadId, activeTab, hasLoadedMessages]);

  // Load templates from cache first, then from API if needed
  useEffect(() => {
    loadTemplatesWithCache();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    setHasLoadedMessages(true);
    try {
      const response = await api.conversations.getByLeadId(leadId);
      // Filter messages by type
      const filtered = response.data.filter((msg: Message) => {
        if (activeTab === 'email') return msg.type === 'email' || msg.type === 'note';
        return msg.type === 'sms' || msg.type === 'call';
      });
      setMessages(filtered);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatesWithCache = async () => {
    // Check localStorage for cached templates
    const cacheKey = 'message_templates_cache';
    const cacheExpiry = 60 * 60 * 1000; // 1 hour
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheExpiry) {
          // Use cached data
          setTemplates(data || []);
          setHasLoadedTemplates(true);
          return;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }

    // Load from API
    loadTemplates();
  };

  const loadTemplates = async () => {
    try {
      const response = await api.templates.getAll();
      const templatesData = response.data?.data || response.data || [];
      setTemplates(templatesData);
      
      // Cache the templates
      try {
        localStorage.setItem('message_templates_cache', JSON.stringify({
          data: templatesData,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Ignore cache errors
      }
      
      setHasLoadedTemplates(true);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
      setHasLoadedTemplates(true);
    }
  };

  const applyTemplate = async (templateId: string) => {
    console.log('=== APPLY TEMPLATE CALLED ===');
    console.log('Template ID:', templateId);
    console.log('Lead ID:', leadId);
    
    if (!templateId || !leadId) {
      console.log('Missing templateId or leadId, returning');
      return;
    }
    
    setLoadingTemplate(true);
    setShowTemplateDropdown(false);
    
    try {
      console.log('Making API call to apply template...');
      const response = await api.templates.applyToLead(templateId, leadId.toString());
      
      console.log('=== FULL RESPONSE STRUCTURE ===');
      console.log('Response object:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data type:', typeof response.data);
      console.log('Response.data keys:', response.data ? Object.keys(response.data) : 'null');
      
      // Check different possible response structures
      console.log('=== CHECKING RESPONSE PATHS ===');
      console.log('response.data?.processed_content:', response.data?.processed_content);
      console.log('response.data?.data?.processed_content:', response.data?.data?.processed_content);
      console.log('response.processed_content:', (response as any).processed_content);
      
      // Try to get the processed content from various possible paths
      let processedContent = '';
      if (response.data?.data?.processed_content) {
        processedContent = response.data.data.processed_content;
        console.log('Found content at response.data.data.processed_content');
      } else if (response.data?.processed_content) {
        processedContent = response.data.processed_content;
        console.log('Found content at response.data.processed_content');
      } else if ((response as any).processed_content) {
        processedContent = (response as any).processed_content;
        console.log('Found content at response.processed_content');
      }
      
      console.log('=== SETTING COMPOSE TEXT ===');
      console.log('Final processedContent:', processedContent);
      console.log('processedContent length:', processedContent.length);
      console.log('Current composeText before update:', composeText);
      
      setComposeText(processedContent);
      
      // Force a re-render by setting a dummy state after a small delay
      setTimeout(() => {
        console.log('Checking if text was set:', composeText);
      }, 100);
      
      // Show any missing variables
      const missingVars = response.data?.data?.missing_variables || 
                         response.data?.missing_variables || 
                         (response as any).missing_variables;
      
      if (missingVars && missingVars.length > 0) {
        console.log('Missing variables:', missingVars);
        alert(`Template applied. Missing information: ${missingVars.join(', ')}`);
      }
    } catch (error) {
      console.error('=== ERROR IN APPLY TEMPLATE ===');
      console.error('Error object:', error);
      
      // Fallback to just using the template content
      const template = templates.find(t => t.id === templateId);
      if (template) {
        console.log('Using fallback template:', template.template);
        setComposeText(template.template || '');
      }
    } finally {
      setLoadingTemplate(false);
      setSelectedTemplateId('');
      console.log('=== APPLY TEMPLATE COMPLETE ===');
    }
  };

  const sendMessage = async () => {
    if (!composeText?.trim() || sending) return;
    
    setSending(true);
    try {
      await api.conversations.addMessage(leadId, {
        type: activeTab === 'email' ? 'email' : 'sms',
        direction: 'outbound',
        content: composeText
      });
      
      setComposeText('');
      setReplyTo(null);
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    // Format: "Aug 27, 2025 at 4:37 PM"
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} at ${timeStr}`;
  };

  const handleReply = (messageId: number, originalContent: string) => {
    setReplyTo(messageId);
    // Add quote to compose box
    const quote = originalContent.split('\\n').map(line => `> ${line}`).join('\\n');
    setComposeText(`\\n\\n${quote}\\n\\n`);
    // Focus compose box
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(0, 0);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Text
          </button>
        </div>
      </div>

      {/* Conversation Content */}
      <div className="flex flex-col min-h-[200px] max-h-[400px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Loading messages...
            </div>
          ) : (
            <>
              {/* Initial Inquiry - Always First for Email Tab */}
              {initialInquiry?.content && activeTab === 'email' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      Initial Inquiry
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {initialInquiry.date ? formatMessageDate(initialInquiry.date) : 'Date unknown'}
                    </span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">
                    {initialInquiry.content}
                  </p>
                  <button
                    onClick={() => handleReply(-1, initialInquiry.content)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                </div>
              )}

              {/* Other Messages */}
              {messages.length === 0 && !initialInquiry?.content && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No {activeTab === 'email' ? 'emails' : 'text messages'} yet
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.direction === 'inbound'
                      ? 'bg-gray-50 dark:bg-gray-700/50'
                      : 'bg-green-50 dark:bg-green-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-semibold ${
                      message.direction === 'inbound'
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-green-900 dark:text-green-100'
                    }`}>
                      {message.direction === 'inbound' ? 'Lead' : 'You'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatMessageDate(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">
                    {message.content}
                  </p>
                  {message.direction === 'inbound' && (
                    <button
                      onClick={() => handleReply(message.id, message.content)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Compose Area - Fixed at Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          {/* Template Selector */}
          <div className="mb-3 relative">
            <button
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Use Template</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showTemplateDropdown && (
              <div className="absolute z-10 top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No templates available</div>
                ) : (
                  <div className="py-1">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          applyTemplate(template.id);
                          setSelectedTemplateId(template.id);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{template.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {template.type.replace('_', ' ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {loadingTemplate && (
              <span className="ml-2 text-sm text-gray-500">Applying template...</span>
            )}
          </div>

          <div className="flex gap-2">
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  sendMessage();
                }
              }}
              placeholder={`Type your ${activeTab === 'email' ? 'email' : 'text message'}... (Ctrl+Enter to send)`}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 min-h-[120px]"
              rows={6}
            />
            <button
              onClick={sendMessage}
              disabled={!composeText?.trim() || sending}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                !composeText?.trim() || sending
                  ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            >
              <Send className="w-4 h-4" />
              Send {activeTab === 'email' ? 'Email' : 'Text'}
            </button>
          </div>
          {replyTo !== null && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Replying to {replyTo === -1 ? 'initial inquiry' : `message #${replyTo}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}