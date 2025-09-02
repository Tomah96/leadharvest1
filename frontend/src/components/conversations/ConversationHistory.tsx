"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  Plus,
  RefreshCw
} from "lucide-react";
import { api } from "@/lib/api-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { Lead, Message } from "@/types";

interface ConversationHistoryProps {
  leadId: string;
}

export default function ConversationHistory({ leadId }: ConversationHistoryProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversation();
  }, [leadId]);

  const fetchConversation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.conversations.getByLeadId(leadId);
      setLead(response.data.lead);
      setMessages(response.data.messages || []);
    } catch (err) {
      setError("Failed to load conversation. Please try again.");
      console.error("Error fetching conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchConversation();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading conversation..." />;
  }

  if (error) {
    return (
      <ErrorAlert 
        message={error} 
        actionText="Try again"
        onAction={fetchConversation}
      />
    );
  }

  const fullName = lead ? [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown" : "Unknown";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {fullName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lead?.phone || lead?.email || "No contact info"}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="button-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No messages yet
            </p>
            <p className="text-sm text-gray-400">
              Start a conversation by sending a message or note
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <button className="flex-1 button-secondary flex items-center justify-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>
          <button className="flex-1 button-secondary flex items-center justify-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
          <button className="flex-1 button-primary flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Note</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOutbound 
          ? 'bg-primary-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
      }`}>
        {/* Message Header */}
        <div className="flex items-center space-x-2 mb-2">
          {message.type === 'email' ? (
            <Mail className="w-3 h-3" />
          ) : message.type === 'sms' ? (
            <Phone className="w-3 h-3" />
          ) : (
            <MessageSquare className="w-3 h-3" />
          )}
          <span className="text-xs opacity-75">
            {isOutbound ? (message.from_name || 'You') : (message.from_name || 'Lead')}
          </span>
          <Clock className="w-3 h-3 opacity-50" />
          <span className="text-xs opacity-75">
            {new Date(message.created_at).toLocaleString()}
          </span>
        </div>

        {/* Email Subject */}
        {message.type === 'email' && message.subject && (
          <div className="text-sm font-medium mb-1">
            {message.subject}
          </div>
        )}

        {/* Message Body */}
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Contact Info */}
        {(message.from_contact || message.to_contact) && (
          <div className="text-xs opacity-75 mt-2">
            {message.from_contact && `From: ${message.from_contact}`}
            {message.from_contact && message.to_contact && ' | '}
            {message.to_contact && `To: ${message.to_contact}`}
          </div>
        )}
      </div>
    </div>
  );
}