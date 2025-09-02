"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, MessageSquare, FileText, ChevronRight, User, Save } from "lucide-react";

export default function SettingsPage() {
  const [agentInfo, setAgentInfo] = useState({
    agent_name: "",
    agent_company: "",
    agent_phone: "",
    agent_email: ""
  });
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("agentInfo");
    if (saved) {
      setAgentInfo(JSON.parse(saved));
    } else {
      // Set defaults for Toma
      const defaults = {
        agent_name: "Toma Holovatsky",
        agent_company: "RE/MAX Plus",
        agent_phone: "(215) 280-1874",
        agent_email: "t.holovatskyy@gmail.com"
      };
      setAgentInfo(defaults);
      localStorage.setItem("agentInfo", JSON.stringify(defaults));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("agentInfo", JSON.stringify(agentInfo));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (field: string, value: string) => {
    setAgentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure your LeadHarvest CRM preferences and integrations
        </p>
      </div>

      <div className="space-y-6">
        {/* Agent Information */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Agent Information
              </h2>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This information will be used in your message templates.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={agentInfo.agent_name}
                onChange={(e) => handleChange("agent_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="John Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <input
                type="text"
                value={agentInfo.agent_company}
                onChange={(e) => handleChange("agent_company", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="RE/MAX Plus"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={agentInfo.agent_phone}
                onChange={(e) => handleChange("agent_phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={agentInfo.agent_email}
                onChange={(e) => handleChange("agent_email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="agent@company.com"
              />
            </div>
          </div>
          
          {saved && (
            <div className="mt-4 p-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
              ✓ Agent information saved successfully
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Email Templates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure auto-reply templates for lead communication.
          </p>
          <Link 
            href="/settings/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            Manage Templates
          </Link>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Integrations
          </h2>
          <div className="space-y-3">
            <Link 
              href="/settings/gmail"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Gmail Integration</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connect your Gmail account to import leads</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link 
              href="/settings/openphone"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-50 pointer-events-none"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">OpenPhone Integration</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connect OpenPhone for SMS conversations (Coming soon)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}