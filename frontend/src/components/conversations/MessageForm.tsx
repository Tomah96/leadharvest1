"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Phone, Mail, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

const messageSchema = z.object({
  type: z.enum(["note", "email", "sms", "call"]),
  subject: z.string().optional(),
  content: z.string().min(1, "Message content is required").max(2000),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageFormProps {
  leadId: string;
  leadEmail?: string;
  leadPhone?: string;
  onMessageSent?: () => void;
}

export default function MessageForm({ 
  leadId, 
  leadEmail, 
  leadPhone, 
  onMessageSent 
}: MessageFormProps) {
  const [messageType, setMessageType] = useState<"note" | "email" | "sms">("note");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      type: "note",
      content: "",
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    setSending(true);
    setError(null);

    try {
      const messageData = {
        type: messageType,
        direction: "outbound" as const,
        content: data.content,
        ...(messageType === "email" && data.subject && { subject: data.subject }),
      };

      await api.conversations.addMessage(leadId, messageData);
      reset();
      onMessageSent?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const messageTypeOptions = [
    {
      value: "note" as const,
      label: "Note",
      icon: <FileText className="w-4 h-4" />,
      available: true,
      description: "Internal note (not sent to lead)"
    },
    {
      value: "email" as const,
      label: "Email",
      icon: <Mail className="w-4 h-4" />,
      available: !!leadEmail,
      description: leadEmail ? `Send to ${leadEmail}` : "No email available"
    },
    {
      value: "sms" as const,
      label: "SMS",
      icon: <Phone className="w-4 h-4" />,
      available: !!leadPhone,
      description: leadPhone ? `Send to ${leadPhone}` : "No phone available"
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Send Message
      </h3>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Message Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {messageTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMessageType(option.value)}
                disabled={!option.available}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  messageType === option.value
                    ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-400"
                    : option.available
                    ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-900 dark:border-gray-700 dark:text-gray-500"
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {messageTypeOptions.find(opt => opt.value === messageType)?.description}
          </p>
        </div>

        {/* Email Subject (only for emails) */}
        {messageType === "email" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              {...register("subject")}
              className="input"
              placeholder="Email subject..."
            />
            {errors.subject && (
              <p className="mt-1 text-xs text-error">{errors.subject.message}</p>
            )}
          </div>
        )}

        {/* Message Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {messageType === "note" ? "Note" : "Message"}
          </label>
          <textarea
            {...register("content")}
            rows={4}
            className="input"
            placeholder={
              messageType === "note"
                ? "Add an internal note about this lead..."
                : messageType === "email"
                ? "Type your email message..."
                : "Type your SMS message..."
            }
          />
          {errors.content && (
            <p className="mt-1 text-xs text-error">{errors.content.message}</p>
          )}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>
              {messageType === "note" ? "Internal note only" : `Will be sent to lead`}
            </span>
            <span>{watch("content")?.length || 0}/2000</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => reset()}
            className="button-secondary"
            disabled={sending}
          >
            Clear
          </button>
          <button
            type="submit"
            className="button-primary flex items-center space-x-2"
            disabled={sending}
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-4 h-4" />
            <span>
              {sending 
                ? "Sending..." 
                : messageType === "note" 
                ? "Add Note" 
                : `Send ${messageType.toUpperCase()}`
              }
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}