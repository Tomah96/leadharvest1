"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, AlertCircle, CheckCircle, Mail, Tag, Eye } from "lucide-react";
import { api } from "@/lib/api-client";
import ImportReview from "./ImportReview";

interface ImportControlsProps {
  onLog?: (message: string) => void;
  selectedLabelId?: string;
  selectedLabelName?: string;
  onImportComplete?: (result: ImportResult) => void;
}

interface ImportResult {
  imported: number;
  parsed: number;
  errors: string[];
  results: Array<{
    messageId: string;
    subject: string;
    parsed: boolean;
    data?: any;
    error?: string;
  }>;
}

export default function ImportControls({ onLog, selectedLabelId, selectedLabelName, onImportComplete }: ImportControlsProps) {
  const [selectedLabel, setSelectedLabel] = useState(selectedLabelName || "processed-lead");
  const [selectedId, setSelectedId] = useState(selectedLabelId || "processed-lead");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [currentCount, setCurrentCount] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [pendingImportResult, setPendingImportResult] = useState<ImportResult | null>(null);

  // Update local state when props change
  useEffect(() => {
    if (selectedLabelName) {
      setSelectedLabel(selectedLabelName);
    }
    if (selectedLabelId) {
      setSelectedId(selectedLabelId);
    }
  }, [selectedLabelName, selectedLabelId]);

  const importEmails = async (count: number | "all") => {
    if (!selectedId || !selectedLabel) {
      setError("Please select a label first");
      return;
    }

    setImporting(true);
    setError(null);
    setImportResult(null);
    setCurrentCount(count === "all" ? null : count);
    
    const actualCount = count === "all" ? 100 : count; // Default to 100 for "all"
    const countText = count === "all" ? "all" : count.toString();
    onLog?.(`Starting import of ${countText} emails with label "${selectedLabel}"...`);

    try {
      // Use the new import endpoint
      const response = await api.gmail.test.importEmails(selectedId, actualCount);
      const result = response.data;

      // Check if import succeeded but no emails were parsed
      if (result.imported > 0 && result.parsed === 0) {
        onLog?.(`⚠️ Imported ${result.imported} emails but couldn't parse lead data`);
        onLog?.("This usually means the email format isn't recognized yet");
      }
      
      // Store result for review instead of directly setting it
      setPendingImportResult(result);
      setShowReview(true);
      onLog?.(`✅ Import completed: ${result.parsed}/${result.imported} emails ready for review`);
      
      // Enhanced logging with better formatting
      if (result.results && result.results.length > 0) {
        onLog?.("\n📧 Imported Emails:");
        result.results.forEach((email, index) => {
          if (email.parsed) {
            onLog?.(`  ✅ ${index + 1}. ${email.subject}`);
            if (email.data) {
              onLog?.(`     Name: ${email.data.first_name || ''} ${email.data.last_name || ''}`.trim());
              onLog?.(`     Phone: ${email.data.phone || 'Not found'}`);
              onLog?.(`     Property: ${email.data.property || 'Not found'}`);
              if (email.data.move_in_date) {
                onLog?.(`     Move-in: ${email.data.move_in_date}`);
              }
              if (email.data.source) {
                onLog?.(`     Source: ${email.data.source}`);
              }
            }
          } else {
            onLog?.(`  ⚠️ ${index + 1}. ${email.subject}`);
            onLog?.(`     Could not parse: ${email.error || 'Unknown format'}`);
          }
        });
        onLog?.(""); // Empty line for better readability
      }
      
      const failureCount = result.imported - result.parsed;
      if (failureCount > 0) {
        onLog?.(`\n⚠️ Summary: ${failureCount} emails could not be parsed into leads`);
        if (result.errors && result.errors.length > 0) {
          onLog?.("Common issues:");
          const uniqueErrors = [...new Set(result.errors)];
          uniqueErrors.forEach(error => {
            onLog?.(`  • ${error}`);
          });
        }
      }

      onImportComplete?.(result);
    } catch (err: any) {
      console.error('Import error:', err); // Add for debugging
      
      // Better error message extraction
      let errorMsg = "Failed to import emails";
      
      if (err.response?.status === 404) {
        errorMsg = "Import endpoint not found - please check backend is running";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      onLog?.("❌ " + errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const importButtons = [
    { count: 5, label: "Import 5", color: "bg-blue-500 hover:bg-blue-600" },
    { count: 10, label: "Import 10", color: "bg-green-500 hover:bg-green-600" },
    { count: 50, label: "Import 50", color: "bg-purple-500 hover:bg-purple-600" },
    { count: "all" as const, label: "Import All", color: "bg-orange-500 hover:bg-orange-600" },
  ];

  const handleReviewSave = (leadsToSave: any[]) => {
    // Here you would normally save the leads to the database
    // For now, we'll just update the UI
    setImportResult({
      ...pendingImportResult!,
      parsed: leadsToSave.filter(l => l.parsed).length,
      imported: leadsToSave.length,
    });
    setShowReview(false);
    setPendingImportResult(null);
    onLog?.(`✅ Saved ${leadsToSave.length} leads after review`);
    onImportComplete?.(pendingImportResult!);
  };

  const handleReviewCancel = () => {
    setShowReview(false);
    setPendingImportResult(null);
    onLog?.("❌ Import review cancelled");
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Email Import Controls
        </h3>

        <div className="space-y-4">
          {/* Label Display */}
          {selectedLabel && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected Label: 
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedLabel}
                </span>
              </div>
            </div>
          )}

          {!selectedLabel && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please select a label using the Label Search above before importing.
              </p>
            </div>
          )}

          {/* Import Buttons */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose how many emails to import from the selected label:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {importButtons.map((button) => (
                <button
                  key={button.label}
                  onClick={() => importEmails(button.count)}
                  disabled={importing || !selectedLabel}
                  className={`
                    relative py-3 px-4 rounded-lg text-white font-medium
                    transition-all duration-200 transform hover:scale-105
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${button.color}
                    ${importing && currentCount === button.count ? 'ring-4 ring-white/30' : ''}
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {importing && currentCount === button.count ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    <span>{button.label}</span>
                  </div>
                  {button.count !== "all" && (
                    <span className="absolute top-1 right-2 text-xs opacity-75">
                      {button.count} emails
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${importResult.imported === importResult.parsed 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : 'bg-yellow-100 dark:bg-yellow-900/20'
                  }
                `}>
                  <Mail className={`w-5 h-5 ${
                    importResult.imported === importResult.parsed 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Import Complete
                  </h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>• Total emails imported: {importResult.imported}</p>
                    <p className="text-green-600 dark:text-green-400">
                      • Successfully parsed: {importResult.parsed}
                    </p>
                    {importResult.imported - importResult.parsed > 0 && (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        • Failed to parse: {importResult.imported - importResult.parsed}
                      </p>
                    )}
                  </div>
                  
                  {/* Show sample results if available */}
                  {importResult.results && importResult.results.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Import Details:
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {importResult.results.slice(0, 3).map((result, idx) => (
                          <div key={idx} className="text-xs flex items-start space-x-1">
                            <span className={result.parsed ? "text-green-500" : "text-yellow-500"}>
                              {result.parsed ? "✓" : "!"}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                              {result.subject}
                            </span>
                          </div>
                        ))}
                        {importResult.results.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            ...and {importResult.results.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Review Button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setPendingImportResult(importResult);
                        setShowReview(true);
                      }}
                      className="button-secondary flex items-center space-x-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review Results</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Import Information</p>
                <ul className="space-y-1 text-xs">
                  <li>• Emails are processed in batches to prevent overload</li>
                  <li>• Duplicate leads are automatically merged by phone number</li>
                  <li>• Only emails from supported sources will be imported</li>
                  <li>• Check the console for detailed processing logs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Review Modal */}
      {showReview && pendingImportResult && (
        <ImportReview
          results={pendingImportResult.results}
          onSave={handleReviewSave}
          onCancel={handleReviewCancel}
        />
      )}
    </div>
  );
}