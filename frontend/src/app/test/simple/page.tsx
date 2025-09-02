"use client";

import { useState } from "react";
import { Search, Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api-client";

export default function SimpleTestPage() {
  const [labelQuery, setLabelQuery] = useState("processed-lead");
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState("");
  const [summary, setSummary] = useState<string[]>([]);

  const addSummary = (message: string) => {
    setSummary(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const testConnection = async () => {
    setLoading(true);
    setCurrentAction("Testing Gmail connection...");
    addSummary("Starting Gmail connection test");

    try {
      console.group("🔍 Gmail Connection Test");
      console.log("Testing connection...");
      
      const response = await api.gmail.testConnection();
      
      console.log("✅ Response received:", response);
      console.log("📊 Full response data:", response.data);
      
      if (response.data.labels) {
        console.log("📧 Gmail Labels Found:", response.data.labels.length);
        console.table(response.data.labels);
      }
      
      addSummary(`✅ Connected! Found ${response.data.labels?.length || 0} labels`);
      
      console.groupEnd();
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      addSummary("❌ Connection test failed");
      console.groupEnd();
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const searchLabels = async () => {
    setLoading(true);
    setCurrentAction(`Searching for labels containing "${labelQuery}"...`);
    addSummary(`Searching for labels: "${labelQuery}"`);

    try {
      console.group(`🏷️ Label Search: "${labelQuery}"`);
      console.log("Search query:", labelQuery);
      
      // For now, use test connection to get all labels and filter
      const response = await api.gmail.testConnection();
      
      if (response.data.labels) {
        const filtered = response.data.labels.filter(label => 
          label.name.toLowerCase().includes(labelQuery.toLowerCase())
        );
        
        console.log(`Found ${filtered.length} matching labels:`);
        console.table(filtered);
        
        addSummary(`✅ Found ${filtered.length} matching labels`);
        
        // Log each label as expandable object
        filtered.forEach((label, index) => {
          console.log(`Label ${index + 1}:`, {
            id: label.id,
            name: label.name,
            type: label.type,
            ...label
          });
        });
      }
      
      console.groupEnd();
    } catch (error) {
      console.error("❌ Label search failed:", error);
      addSummary("❌ Label search failed");
      console.groupEnd();
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const importEmails = async (count: number | "all") => {
    setLoading(true);
    const countText = count === "all" ? "all" : count.toString();
    setCurrentAction(`Importing ${countText} emails...`);
    addSummary(`Starting import of ${countText} emails`);

    try {
      console.group(`📥 Email Import (${countText} emails)`);
      console.log("Import parameters:", {
        count: count,
        label: labelQuery,
        timestamp: new Date().toISOString()
      });
      
      const response = await api.gmail.testProcessedLeads();
      
      console.log("✅ Import Response:", response);
      console.log("📊 Full Data Structure:", response.data);
      
      // Log summary
      const summary = {
        totalEmails: response.data.totalEmails,
        successCount: response.data.successCount,
        failureCount: response.data.failureCount,
        sources: response.data.sources
      };
      console.log("📈 Import Summary:", summary);
      
      // Log each email as expandable object
      if (response.data.results) {
        console.group("📧 Individual Email Results");
        response.data.results.forEach((email, index) => {
          const status = email.parsed === 'success' ? '✅' : '❌';
          console.log(`${status} Email ${index + 1}:`, {
            subject: email.subject,
            from: email.from,
            date: email.date,
            source: email.source,
            parsed: email.parsed,
            timestamp: new Date(email.date).toLocaleString()
          });
        });
        console.groupEnd();
      }
      
      // Log source breakdown
      if (response.data.sources) {
        console.group("📊 Source Breakdown");
        console.table(response.data.sources);
        console.groupEnd();
      }
      
      // Log any errors
      if (response.data.errors && response.data.errors.length > 0) {
        console.group("⚠️ Parsing Errors");
        response.data.errors.forEach((error, index) => {
          console.error(`Error ${index + 1}:`, error);
        });
        console.groupEnd();
      }
      
      addSummary(`✅ Import complete: ${response.data.successCount}/${response.data.totalEmails} successful`);
      
      console.groupEnd();
    } catch (error) {
      console.error("❌ Email import failed:", error);
      addSummary("❌ Email import failed");
      console.groupEnd();
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Gmail Test Interface</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Simple test page - Check browser console for detailed results
      </p>

      {/* Test Actions */}
      <div className="space-y-6">
        {/* Connection Test */}
        <div className="card">
          <h2 className="font-semibold mb-4">1. Test Gmail Connection</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className="button-primary"
          >
            {loading && currentAction.includes("connection") ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </button>
        </div>

        {/* Label Search */}
        <div className="card">
          <h2 className="font-semibold mb-4">2. Search Gmail Labels</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={labelQuery}
              onChange={(e) => setLabelQuery(e.target.value)}
              placeholder="Enter label to search..."
              className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
            <button
              onClick={searchLabels}
              disabled={loading}
              className="button-secondary"
            >
              {loading && currentAction.includes("Search") ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Import Controls */}
        <div className="card">
          <h2 className="font-semibold mb-4">3. Import Emails</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => importEmails(5)}
              disabled={loading}
              className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading && currentAction.includes("5") ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              ) : (
                <Download className="w-4 h-4 inline mr-2" />
              )}
              Import 5
            </button>
            <button
              onClick={() => importEmails(10)}
              disabled={loading}
              className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading && currentAction.includes("10") ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              ) : (
                <Download className="w-4 h-4 inline mr-2" />
              )}
              Import 10
            </button>
            <button
              onClick={() => importEmails(50)}
              disabled={loading}
              className="py-2 px-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading && currentAction.includes("50") ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              ) : (
                <Download className="w-4 h-4 inline mr-2" />
              )}
              Import 50
            </button>
            <button
              onClick={() => importEmails("all")}
              disabled={loading}
              className="py-2 px-4 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading && currentAction.includes("all") ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              ) : (
                <Download className="w-4 h-4 inline mr-2" />
              )}
              Import All
            </button>
          </div>
        </div>

        {/* Current Action */}
        {currentAction && (
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-300">{currentAction}</span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="card">
          <h2 className="font-semibold mb-4">Activity Summary</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 max-h-64 overflow-y-auto">
            {summary.length === 0 ? (
              <p className="text-gray-500">No activity yet. Open browser console (F12) to see detailed results.</p>
            ) : (
              <div className="space-y-1 text-sm font-mono">
                {summary.map((item, index) => (
                  <div key={index} className="text-gray-700 dark:text-gray-300">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <h3 className="font-semibold mb-2">📋 Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Open browser console (Press F12 → Console tab)</li>
            <li>Click "Test Connection" to verify Gmail access</li>
            <li>Search for labels or use default "processed-lead"</li>
            <li>Click import buttons to process emails</li>
            <li>Check console for expandable data objects</li>
          </ol>
        </div>
      </div>
    </div>
  );
}