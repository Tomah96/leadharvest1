"use client";

import { CheckCircle, XCircle, Mail, AlertTriangle } from "lucide-react";
import type { TestProcessedLeadsResponse, TestConnectionResponse } from "@/types";

interface TestResultsProps {
  results: TestProcessedLeadsResponse | null;
  connectionStatus: TestConnectionResponse | null;
}

export default function TestResults({ results, connectionStatus }: TestResultsProps) {
  if (!results) return null;

  const totalParsed = results.results.length;
  const successCount = results.results.filter(r => r.parsed === 'success').length;
  const failCount = results.results.filter(r => r.parsed === 'failed').length;
  const successRate = totalParsed > 0 ? Math.round((successCount / totalParsed) * 100) : 0;

  // Calculate source distribution for visual display
  const sourceCounts = Object.entries(results.sources)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  const sourceColors = {
    zillow: 'bg-blue-500',
    realtor: 'bg-purple-500',
    apartments: 'bg-green-500',
    rentmarketplace: 'bg-orange-500',
    unknown: 'bg-gray-500'
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Test Results
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {results.totalEmails}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Emails Found
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {successRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Parse Success Rate
          </div>
        </div>
      </div>

      {/* Source Distribution */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Email Sources
        </h3>
        <div className="space-y-2">
          {sourceCounts.map(([source, count]) => {
            const percentage = results.totalEmails > 0 
              ? Math.round((count / results.totalEmails) * 100) 
              : 0;
            
            return (
              <div key={source} className="flex items-center space-x-3">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {source}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div 
                      className={`${sourceColors[source as keyof typeof sourceColors]} h-4 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parse Results */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Parse Results
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Successful: {successCount}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Failed: {failCount}
            </span>
          </div>
        </div>
      </div>

      {/* Sample Emails Table */}
      {results.results.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Sample Emails
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                    Source
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.results.slice(0, 10).map((email, index) => (
                  <tr 
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 px-3">
                      <div className="truncate max-w-xs" title={email.subject}>
                        {email.subject}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {email.from}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        email.source === 'unknown' 
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      }`}>
                        {email.source}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {email.parsed === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 inline" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {results.results.length > 10 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Showing 10 of {results.results.length} emails
            </p>
          )}
        </div>
      )}

      {/* Warnings */}
      {results.sources.unknown > 0 && (
        <div className="mt-6 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">
                Unknown Email Sources Detected
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {results.sources.unknown} emails could not be identified by source. 
                These may need manual review.
              </p>
            </div>
          </div>
        </div>
      )}

      {successRate < 80 && (
        <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-error">
                Low Parse Success Rate
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Only {successRate}% of emails were successfully parsed. 
                Review failed emails to improve parsing logic.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}