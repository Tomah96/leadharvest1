"use client";

import { useState, useEffect } from "react";
import { 
  Mail, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  AlertCircle,
  Download
} from "lucide-react";
import { api } from "@/lib/api-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import TestResults from "@/components/gmail/TestResults";
import ConsoleOutput from "@/components/gmail/ConsoleOutput";
import type { TestConnectionResponse, TestProcessedLeadsResponse } from "@/types";

export default function GmailTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<TestConnectionResponse | null>(null);
  const [testResults, setTestResults] = useState<TestProcessedLeadsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  useEffect(() => {
    // Initial connection check
    testConnection();
  }, []);

  const addLog = (message: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    addLog("Testing Gmail connection...");

    try {
      const response = await api.gmail.testConnection();
      setConnectionStatus(response.data);
      
      if (response.data.connected) {
        addLog(`✅ Connected to Gmail`);
        addLog(`Found ${response.data.labelsCount} labels`);
        
        if (response.data.hasProcessedLeadLabel) {
          addLog(`✅ Located "processed-lead" label`);
        } else {
          addLog(`❌ Could not find "processed-lead" label`);
        }
      } else {
        addLog(`❌ Not connected to Gmail`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || "Failed to test connection";
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessedLeads = async () => {
    if (!connectionStatus?.connected) {
      setError("Please connect Gmail first");
      return;
    }

    setTesting(true);
    setError(null);
    addLog("Fetching processed leads...");

    try {
      const response = await api.gmail.testProcessedLeads();
      setTestResults(response.data);
      
      addLog(`Found ${response.data.totalEmails} total emails`);
      addLog(`Processing ${response.data.results.length} sample emails`);
      
      // Log source breakdown
      Object.entries(response.data.sources).forEach(([source, count]) => {
        if (count > 0) {
          addLog(`  - ${source}: ${count} emails`);
        }
      });

      const successCount = response.data.results.filter(r => r.parsed === 'success').length;
      const failCount = response.data.results.filter(r => r.parsed === 'failed').length;
      
      addLog(`✅ Successfully parsed: ${successCount}`);
      if (failCount > 0) {
        addLog(`❌ Failed to parse: ${failCount}`);
      }
      
      addLog("Complete!");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || "Failed to fetch emails";
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setConsoleLogs([]);
    addLog("Results cleared");
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
            <TestTube className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gmail Integration Test Dashboard
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Test your Gmail connection and preview email parsing results before processing your entire inbox
        </p>
      </div>

      {error && (
        <ErrorAlert 
          message={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls and Status */}
        <div className="space-y-6">
          {/* Connection Status Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Connection Status
            </h2>
            
            {loading ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="md" text="Checking connection..." />
              </div>
            ) : connectionStatus ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {connectionStatus.connected ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-medium ${
                    connectionStatus.connected 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {connectionStatus.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                {connectionStatus.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {connectionStatus.message}
                  </p>
                )}

                {connectionStatus.connected && (
                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Labels:</span>
                      <span className="font-medium">{connectionStatus.labelsCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">"processed-lead" Label:</span>
                      <span className={`font-medium ${
                        connectionStatus.hasProcessedLeadLabel 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {connectionStatus.hasProcessedLeadLabel ? 'Found' : 'Not Found'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No connection data</p>
            )}
          </div>

          {/* Test Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Test Actions
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={testConnection}
                disabled={loading}
                className="w-full button-secondary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Test Connection</span>
              </button>

              <button
                onClick={fetchProcessedLeads}
                disabled={testing || !connectionStatus?.connected}
                className="w-full button-primary flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Fetch Processed Leads</span>
              </button>

              <button
                onClick={clearResults}
                disabled={!testResults && consoleLogs.length === 0}
                className="w-full button-secondary"
              >
                Clear Results
              </button>
            </div>

            {!connectionStatus?.connected && (
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-warning">
                    Connect your Gmail account first to test email processing
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Test Results */}
          {testResults && (
            <TestResults 
              results={testResults} 
              connectionStatus={connectionStatus}
            />
          )}

          {/* Console Output */}
          <ConsoleOutput logs={consoleLogs} />
        </div>
      </div>
    </div>
  );
}