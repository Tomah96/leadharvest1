"use client";

import { useState } from "react";
import { Search, Tag, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api-client";

interface GmailLabel {
  id: string;
  name: string;
  messageCount: number;
}

interface LabelSearchProps {
  onLog?: (message: string) => void;
  onLabelSelected?: (labelId: string, labelName: string) => void;
}

export default function LabelSearch({ onLog, onLabelSelected }: LabelSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<{ id: string; name: string } | null>(null);

  const fetchLabels = async () => {
    setLoading(true);
    setError(null);
    onLog?.("Fetching Gmail labels...");

    try {
      // Use the new test endpoint to get Gmail labels
      const response = await api.gmail.test.getLabels();
      
      if (response.data.labels && response.data.labels.length > 0) {
        setLabels(response.data.labels);
        onLog?.(`✅ Found ${response.data.labels.length} labels`);
        
        // Log labels with message counts
        response.data.labels.forEach(label => {
          if (label.messageCount > 0) {
            onLog?.(`  - ${label.name}: ${label.messageCount} messages`);
          }
        });
      } else {
        setLabels([]);
        onLog?.("❌ No labels found");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message || "Failed to fetch labels";
      setError(errorMsg);
      onLog?.("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelSelect = (label: GmailLabel) => {
    setSelectedLabel({ id: label.id, name: label.name });
    onLog?.(`✅ Selected label: "${label.name}" (${label.messageCount} messages)`);
    onLabelSelected?.(label.id, label.name);
  };

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDefaultLabels = () => {
    return [
      "processed-lead",
      "INBOX",
      "SENT",
      "DRAFT",
      "SPAM",
      "TRASH",
      "IMPORTANT",
      "STARRED",
      "UNREAD"
    ];
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Gmail Label Search
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search for labels in your Gmail account. The selected label will be used to find emails to import.
          </p>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labels..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          {/* Fetch Labels Button */}
          <button
            onClick={fetchLabels}
            disabled={loading}
            className="button-primary flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Tag className="w-4 h-4" />
            )}
            <span>Fetch Gmail Labels</span>
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Labels List */}
          {labels.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {filteredLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelSelect(label)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 
                      border-b border-gray-100 dark:border-gray-700 last:border-0
                      flex items-center justify-between group
                      ${selectedLabel?.name === label.name ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {label.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({label.messageCount} messages)
                        </span>
                      </div>
                    </div>
                    {selectedLabel?.name === label.name && (
                      <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Default Labels Suggestion */}
          {labels.length === 0 && !loading && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click "Fetch Gmail Labels" to load your labels, or select from common labels:
              </p>
              <div className="flex flex-wrap gap-2">
                {getDefaultLabels().map((labelName) => (
                  <button
                    key={labelName}
                    onClick={() => handleLabelSelect({ id: labelName, name: labelName, messageCount: 0 })}
                    className={`
                      px-3 py-1 text-sm rounded-full border
                      ${selectedLabel?.name === labelName
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {labelName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Label Display */}
          {selectedLabel && (
            <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                    Selected Label
                  </p>
                  <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                    Emails with the label "{selectedLabel.name}" will be imported
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}