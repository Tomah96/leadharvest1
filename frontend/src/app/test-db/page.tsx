"use client";

import { useState } from "react";
import { 
  Database, 
  Server, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
  Home,
  Hash,
  Calendar,
  Phone,
  Mail,
  User
} from "lucide-react";
import { api } from "@/lib/api-client";

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface TestLead {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  property_address: string;
  unit: string;
  lease_length: number;
  source: "zillow" | "realtor" | "apartments" | "rentmarketplace";
  move_in_date: string;
  occupants: number;
  pets: boolean;
  income: number;
  credit_score: string;
}

// Sample test data sets
const sampleLeads: TestLead[] = [
  {
    first_name: "John",
    last_name: "Smith",
    phone: "215-555-0101",
    email: "john.smith@email.com",
    property_address: "123 Main Street",
    unit: "2B",
    lease_length: 12,
    source: "zillow",
    move_in_date: "2025-09-01",
    occupants: 2,
    pets: false,
    income: 5000,
    credit_score: "720-799"
  },
  {
    first_name: "Maria",
    last_name: "Garcia",
    phone: "215-555-0102",
    email: "maria.garcia@email.com",
    property_address: "456 Oak Avenue",
    unit: "Apt 303",
    lease_length: 6,
    source: "realtor",
    move_in_date: "2025-08-15",
    occupants: 1,
    pets: true,
    income: 4500,
    credit_score: "680-719"
  },
  {
    first_name: "David",
    last_name: "Johnson",
    phone: "215-555-0103",
    email: "david.j@email.com",
    property_address: "789 Pine Road",
    unit: "#A",
    lease_length: 24,
    source: "apartments",
    move_in_date: "2025-10-01",
    occupants: 3,
    pets: false,
    income: 7500,
    credit_score: "800+"
  },
  {
    first_name: "Lisa",
    last_name: "Williams",
    phone: "215-555-0104",
    email: "lisa.w@email.com",
    property_address: "321 Elm Street",
    unit: "Unit 1",
    lease_length: 12,
    source: "rentmarketplace",
    move_in_date: "2025-09-15",
    occupants: 2,
    pets: true,
    income: 6000,
    credit_score: "720-799"
  }
];

export default function TestDatabasePage() {
  const [dbStatus, setDbStatus] = useState<TestResult | null>(null);
  const [apiStatus, setApiStatus] = useState<TestResult | null>(null);
  const [leadCreation, setLeadCreation] = useState<TestResult | null>(null);
  const [selectedLead, setSelectedLead] = useState<TestLead>(sampleLeads[0]);
  const [customLead, setCustomLead] = useState<Partial<TestLead>>({});
  const [testing, setTesting] = useState(false);
  const [testMode, setTestMode] = useState<"sample" | "custom">("sample");

  // Test database connection
  const testDatabaseConnection = async () => {
    setTesting(true);
    setDbStatus(null);
    
    try {
      const response = await api.health.check();
      const healthData = response.data;
      
      if (healthData.database?.status === "connected") {
        setDbStatus({
          success: true,
          message: "Database connected successfully!",
          data: healthData.database
        });
      } else {
        setDbStatus({
          success: false,
          message: "Database not connected - using memory store",
          data: healthData
        });
      }
    } catch (error: any) {
      setDbStatus({
        success: false,
        message: "Failed to check database status",
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  // Test API connection
  const testAPIConnection = async () => {
    setTesting(true);
    setApiStatus(null);
    
    try {
      const response = await api.health.check();
      setApiStatus({
        success: true,
        message: "API is responding correctly!",
        data: {
          status: response.data.status,
          timestamp: response.data.timestamp,
          version: response.data.version
        }
      });
    } catch (error: any) {
      setApiStatus({
        success: false,
        message: "API connection failed",
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  // Test lead creation with new fields
  const testLeadCreation = async () => {
    setTesting(true);
    setLeadCreation(null);
    
    const leadData = testMode === "sample" ? selectedLead : {
      ...sampleLeads[0],
      ...customLead
    };
    
    try {
      const response = await api.leads.create(leadData as any);
      setLeadCreation({
        success: true,
        message: `Lead created successfully with ID: ${response.data.id}`,
        data: response.data
      });
    } catch (error: any) {
      setLeadCreation({
        success: false,
        message: "Failed to create lead",
        error: error.response?.data?.error || error.message
      });
    } finally {
      setTesting(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    await testAPIConnection();
    await testDatabaseConnection();
    await testLeadCreation();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Database Testing Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test database connection, API endpoints, and new schema fields
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Tests */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Connection Tests</h2>
            
            <div className="space-y-3">
              <button
                onClick={testAPIConnection}
                disabled={testing}
                className="w-full button-primary flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Server className="w-5 h-5" />
                )}
                <span>Test API Connection</span>
              </button>

              <button
                onClick={testDatabaseConnection}
                disabled={testing}
                className="w-full button-secondary flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
                <span>Test Database Connection</span>
              </button>

              <button
                onClick={runAllTests}
                disabled={testing}
                className="w-full button-secondary flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                <span>Run All Tests</span>
              </button>
            </div>

            {/* Status Results */}
            <div className="mt-6 space-y-3">
              {apiStatus && (
                <div className={`p-3 rounded-lg ${
                  apiStatus.success 
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}>
                  <div className="flex items-start space-x-2">
                    {apiStatus.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">API Status</p>
                      <p className="text-sm mt-1">{apiStatus.message}</p>
                      {apiStatus.data && (
                        <pre className="text-xs mt-2 p-2 bg-black/10 rounded">
                          {JSON.stringify(apiStatus.data, null, 2)}
                        </pre>
                      )}
                      {apiStatus.error && (
                        <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                          {apiStatus.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {dbStatus && (
                <div className={`p-3 rounded-lg ${
                  dbStatus.success 
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                }`}>
                  <div className="flex items-start space-x-2">
                    {dbStatus.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">Database Status</p>
                      <p className="text-sm mt-1">{dbStatus.message}</p>
                      {dbStatus.data && (
                        <pre className="text-xs mt-2 p-2 bg-black/10 rounded">
                          {JSON.stringify(dbStatus.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lead Creation Test */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Test Lead Creation</h2>
            
            {/* Test Mode Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setTestMode("sample")}
                className={`px-3 py-1 rounded ${
                  testMode === "sample" 
                    ? "bg-primary-600 text-white" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                Sample Data
              </button>
              <button
                onClick={() => setTestMode("custom")}
                className={`px-3 py-1 rounded ${
                  testMode === "custom" 
                    ? "bg-primary-600 text-white" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                Custom Data
              </button>
            </div>

            {testMode === "sample" ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Select Test Lead:
                </label>
                <select
                  value={sampleLeads.indexOf(selectedLead)}
                  onChange={(e) => setSelectedLead(sampleLeads[parseInt(e.target.value)])}
                  className="w-full input"
                >
                  {sampleLeads.map((lead, index) => (
                    <option key={index} value={index}>
                      {lead.first_name} {lead.last_name} - {lead.property_address} {lead.unit}
                    </option>
                  ))}
                </select>

                {/* Display selected lead */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedLead.first_name} {selectedLead.last_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedLead.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedLead.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Home className="w-4 h-4 text-gray-400" />
                    <span>{selectedLead.property_address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span>Unit: {selectedLead.unit}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Lease: {selectedLead.lease_length} months</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Property Address"
                  className="w-full input"
                  value={customLead.property_address || ""}
                  onChange={(e) => setCustomLead({...customLead, property_address: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Unit (e.g., 2B, Apt 303, #A)"
                  className="w-full input"
                  value={customLead.unit || ""}
                  onChange={(e) => setCustomLead({...customLead, unit: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Lease Length (months)"
                  className="w-full input"
                  value={customLead.lease_length || ""}
                  onChange={(e) => setCustomLead({...customLead, lease_length: parseInt(e.target.value)})}
                />
              </div>
            )}

            <button
              onClick={testLeadCreation}
              disabled={testing}
              className="w-full button-primary flex items-center justify-center space-x-2 mt-4"
            >
              {testing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>Create Test Lead</span>
            </button>

            {/* Creation Result */}
            {leadCreation && (
              <div className={`mt-4 p-3 rounded-lg ${
                leadCreation.success 
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-start space-x-2">
                  {leadCreation.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Lead Creation Result</p>
                    <p className="text-sm mt-1">{leadCreation.message}</p>
                    {leadCreation.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer">View Details</summary>
                        <pre className="text-xs mt-2 p-2 bg-black/10 rounded overflow-auto">
                          {JSON.stringify(leadCreation.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {leadCreation.error && (
                      <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                        Error: {leadCreation.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Data Reference */}
          <div className="card">
            <h3 className="font-semibold mb-3">Test Data Scenarios</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>✓ Standard unit format: "Unit 1", "Unit 2B"</p>
              <p>✓ Apartment format: "Apt 303", "Apartment 12"</p>
              <p>✓ Hash format: "#A", "#101"</p>
              <p>✓ Various lease lengths: 6, 12, 24 months</p>
              <p>✓ Different sources: Zillow, Realtor, etc.</p>
              <p>✓ All required fields included</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-6 card">
        <h3 className="font-semibold mb-3">System Information</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">API URL</p>
            <p className="font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Environment</p>
            <p className="font-mono text-xs">{process.env.NODE_ENV || "development"}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Frontend Port</p>
            <p className="font-mono text-xs">3000</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Backend Port</p>
            <p className="font-mono text-xs">3001</p>
          </div>
        </div>
      </div>
    </div>
  );
}