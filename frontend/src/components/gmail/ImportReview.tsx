"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Save,
  X,
  Edit2,
  PhoneOff,
  Mail,
  Home,
  Calendar,
  User
} from "lucide-react";
import type { Lead } from "@/types";
import Modal from "@/components/ui/Modal";
import LeadForm from "@/components/leads/LeadForm";

interface ImportedLead extends Partial<Lead> {
  messageId: string;
  subject: string;
  parsed: boolean;
  error?: string;
}

interface ImportReviewProps {
  results: ImportedLead[];
  onSave: (leads: ImportedLead[]) => void;
  onCancel: () => void;
}

export default function ImportReview({ results, onSave, onCancel }: ImportReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedLeads, setReviewedLeads] = useState<Map<number, ImportedLead>>(new Map());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [excludedIndexes, setExcludedIndexes] = useState<Set<number>>(new Set());

  const currentLead = reviewedLeads.get(currentIndex) || results[currentIndex];
  const isLastLead = currentIndex === results.length - 1;
  const isFirstLead = currentIndex === 0;

  const handleNext = () => {
    if (!isLastLead) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstLead) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleExclude = () => {
    setExcludedIndexes(new Set([...excludedIndexes, currentIndex]));
    if (!isLastLead) {
      handleNext();
    }
  };

  const handleInclude = () => {
    const newExcluded = new Set(excludedIndexes);
    newExcluded.delete(currentIndex);
    setExcludedIndexes(newExcluded);
  };

  const handleEdit = () => {
    setEditingIndex(currentIndex);
  };

  const handleEditSave = (updatedData: Partial<Lead>) => {
    const updatedLead = { ...currentLead, ...updatedData };
    setReviewedLeads(new Map(reviewedLeads.set(currentIndex, updatedLead as ImportedLead)));
    setEditingIndex(null);
  };

  const handleSaveAll = () => {
    const leadsToSave = results
      .map((lead, index) => reviewedLeads.get(index) || lead)
      .filter((_, index) => !excludedIndexes.has(index));
    onSave(leadsToSave);
  };

  const parsedCount = results.filter(r => r.parsed).length;
  const includedCount = results.length - excludedIndexes.size;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Review Imported Leads
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Review and edit imported leads before saving them
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>{parsedCount} parsed</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span>{results.length - parsedCount} failed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{includedCount} to save</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 200px)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Lead {currentIndex + 1} of {results.length}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                disabled={isFirstLead}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={isLastLead}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Email Subject */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Subject:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{currentLead.subject}</p>
          </div>

          {/* Lead Status */}
          <div className="mb-4">
            {currentLead.parsed ? (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Successfully parsed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Failed to parse: {currentLead.error || 'Unknown error'}</span>
              </div>
            )}
          </div>

          {/* Lead Data */}
          {currentLead.parsed && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLead.first_name || ''} {currentLead.last_name || ''}
                        {!currentLead.first_name && !currentLead.last_name && 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {currentLead.phone ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{currentLead.phone}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <PhoneOff className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">Phone</p>
                          <p className="text-sm text-red-600 dark:text-red-400">Missing - Required</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLead.email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Home className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Property</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLead.property_address || 'Not provided'}
                        {currentLead.unit && (
                          <span className="ml-1 font-medium">Unit {currentLead.unit}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Move-in Date</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLead.move_in_date || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Source</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLead.source || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lease Length Display */}
              {currentLead.lease_length && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Lease Length</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentLead.lease_length} months
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {excludedIndexes.has(currentIndex) ? (
                <button
                  onClick={handleInclude}
                  className="button-secondary flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Include</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleExclude}
                    className="button-secondary flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Exclude</span>
                  </button>
                  {currentLead.parsed && (
                    <button
                      onClick={handleEdit}
                      className="button-secondary flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className={`text-sm font-medium ${
              excludedIndexes.has(currentIndex) 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {excludedIndexes.has(currentIndex) ? 'Excluded' : 'Will be saved'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {includedCount} leads will be saved
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                disabled={includedCount === 0}
                className="button-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save {includedCount} Leads</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingIndex !== null && (
        <Modal
          isOpen={true}
          onClose={() => setEditingIndex(null)}
          title="Edit Lead Information"
        >
          <LeadForm
            lead={currentLead as Lead}
            mode="edit"
            onSuccess={() => handleEditSave(currentLead)}
            onCancel={() => setEditingIndex(null)}
          />
        </Modal>
      )}
    </div>
  );
}