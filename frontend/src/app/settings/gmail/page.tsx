"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Link2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Search,
  Download,
  Settings,
  Shield,
  Tag,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api-client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import GmailConnect from "@/components/gmail/GmailConnect";
import LabelSearch from "@/components/gmail/LabelSearch";
import ImportControls from "@/components/gmail/ImportControls";
import ConsoleOutput from "@/components/gmail/ConsoleOutput";
import type { GmailConnection } from "@/types";

export default function GmailSettingsPage() {
  const router = useRouter();
  const [connection, setConnection] = useState<GmailConnection>({
    isConnected: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<"connection" | "labels" | "import" | "settings">("connection");
  const [selectedLabel, setSelectedLabel] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    addLog("Checking Gmail connection status...");

    try {
      const response = await api.gmail.getConnectionStatus();
      setConnection(response.data);
      if (response.data.isConnected) {
        addLog(`✅ Connected to ${response.data.email}`);
      } else {
        addLog("❌ Gmail not connected");
      }
    } catch (err) {
      setError("Failed to check Gmail connection status");
      addLog("❌ Error checking connection status");
      console.error("Error checking Gmail connection:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionChange = (newConnection: GmailConnection) => {
    setConnection(newConnection);
    if (newConnection.isConnected) {
      addLog(`✅ Successfully connected to ${newConnection.email}`);
    } else {
      addLog("✅ Gmail disconnected");
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setConsoleLogs([]);
    addLog("Console cleared");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading Gmail settings..." />
      </div>
    );
  }

  const sections = [
    { id: "connection", label: "Connection", icon: Link2 },
    { id: "labels", label: "Label Search", icon: Tag },
    { id: "import", label: "Import Controls", icon: Download },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Gmail Integration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Connect your Gmail account to automatically import leads from emails
        </p>
      </div>

      {error && (
        <ErrorAlert 
          message={error} 
          actionText="Try again"
          onAction={checkConnection}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Tabs */}
          <div className="card p-2">
            <div className="flex space-x-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`
                      flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg
                      transition-colors duration-200
                      ${activeSection === section.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Connection Status */}
          {activeSection === "connection" && (
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      connection.isConnected 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Mail className={`w-6 h-6 ${
                        connection.isConnected 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Gmail Account
                      </h2>
                      <div className="mt-1 flex items-center space-x-2">
                        {connection.isConnected ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-600 dark:text-green-400">
                              Connected
                            </span>
                            {connection.email && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                • {connection.email}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Not connected
                            </span>
                          </>
                        )}
                      </div>
                      {connection.lastSync && (
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>Last synced: {new Date(connection.lastSync).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={checkConnection}
                    className="button-secondary flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Gmail Connect Component */}
              <GmailConnect 
                connection={connection}
                onConnectionChange={handleConnectionChange}
                onLog={addLog}
              />
            </div>
          )}

          {/* Section 2: Label Search */}
          {activeSection === "labels" && (
            <div className="space-y-4">
              {connection.isConnected ? (
                <LabelSearch 
                  onLog={addLog} 
                  onLabelSelected={(id, name) => {
                    setSelectedLabel({ id, name });
                    addLog(`Label selected: ${name} (ID: ${id})`);
                  }}
                />
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Gmail Not Connected
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Please connect your Gmail account first to search labels.
                    </p>
                    <button
                      onClick={() => setActiveSection("connection")}
                      className="button-primary"
                    >
                      Go to Connection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Import Controls */}
          {activeSection === "import" && (
            <div className="space-y-4">
              {connection.isConnected ? (
                <>
                  {selectedLabel && (
                    <div className="mb-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm text-primary-700 dark:text-primary-300">
                            Selected label: <strong>{selectedLabel.name}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveSection("labels")}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Change label
                        </button>
                      </div>
                    </div>
                  )}
                  <ImportControls 
                    onLog={addLog}
                    selectedLabelId={selectedLabel?.id}
                    selectedLabelName={selectedLabel?.name}
                    onImportComplete={(result) => {
                      addLog(`Import complete: ${result.parsed}/${result.imported} emails parsed`);
                      
                      // Show success message and redirect after successful import
                      if (result.parsed > 0) {
                        setTimeout(() => {
                          router.push('/leads?imported=true');
                        }, 2000);
                      }
                    }}
                  />
                </>
              ) : (
                <div className="card">
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Gmail Not Connected
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Please connect your Gmail account first to import emails.
                    </p>
                    <button
                      onClick={() => setActiveSection("connection")}
                      className="button-primary"
                    >
                      Go to Connection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Settings */}
          {activeSection === "settings" && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Import Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Label to Search
                    </label>
                    <input
                      type="text"
                      defaultValue="processed-lead"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
                      placeholder="Enter label name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Processing Rate Limit
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800">
                      <option value="1">1 email per second</option>
                      <option value="2">2 emails per second</option>
                      <option value="5">5 emails per second</option>
                      <option value="10">10 emails per second</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoMarkRead"
                      defaultChecked
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="autoMarkRead" className="text-sm text-gray-700 dark:text-gray-300">
                      Automatically mark processed emails as read
                    </label>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Security & Privacy
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      We only access emails with specified labels in your Gmail account. 
                      Your connection is secured using OAuth 2.0 and we never store your Gmail password.
                      All processing happens in real-time and email content is not permanently stored.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Console Output */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="card p-0 overflow-hidden">
              <div className="bg-gray-800 dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-100">Console Output</h3>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="bg-gray-900 dark:bg-black">
                <ConsoleOutput logs={consoleLogs} maxHeight="400px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}