"use client";

import { useState } from "react";
import { Mail, Link, Unlink, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import type { GmailConnection } from "@/types";

interface GmailConnectProps {
  connection: GmailConnection;
  onConnectionChange: (connection: GmailConnection) => void;
  onLog?: (message: string) => void;
}

export default function GmailConnect({ connection, onConnectionChange, onLog }: GmailConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    onLog?.("Starting Gmail OAuth flow...");

    try {
      // Get OAuth URL from backend
      const response = await api.gmail.getAuthUrl();
      const authUrl = response.data.url;
      onLog?.("OAuth URL obtained, opening authentication window...");

      // Add redirect_uri to the URL to come back to frontend after backend processing
      const urlWithRedirect = new URL(authUrl);
      urlWithRedirect.searchParams.set('frontend_redirect', 'http://localhost:3000/gmail/success');

      // Open OAuth flow in new window
      const authWindow = window.open(
        urlWithRedirect.toString(),
        'gmail-auth',
        'width=600,height=700,left=200,top=100'
      );

      // Listen for success message from the success page
      const messageHandler = (event: MessageEvent) => {
        if (event.origin === window.location.origin && event.data.type === 'gmail-auth-success') {
          window.removeEventListener('message', messageHandler);
          onLog?.("✅ OAuth authentication successful");
          // Check connection status after success
          checkConnectionStatus();
        }
      };
      window.addEventListener('message', messageHandler);

      // Also check if window closed manually
      const checkInterval = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkInterval);
          window.removeEventListener('message', messageHandler);
          // Check connection status after window closes
          setTimeout(checkConnectionStatus, 1000);
        }
      }, 1000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || "Failed to start Gmail authentication";
      setError(errorMsg);
      onLog?.("❌ " + errorMsg);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Gmail account?")) {
      return;
    }

    setLoading(true);
    setError(null);
    onLog?.("Disconnecting Gmail account...");

    try {
      await api.gmail.disconnect();
      onConnectionChange({
        isConnected: false,
      });
      onLog?.("✅ Gmail account disconnected");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || "Failed to disconnect Gmail";
      setError(errorMsg);
      onLog?.("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await api.gmail.getConnectionStatus();
      onConnectionChange(response.data);
    } catch (err) {
      console.error("Error checking connection status:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Gmail Connection
      </h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {connection.isConnected
            ? "Your Gmail account is connected. LeadHarvest will automatically import leads from emails labeled 'processed-lead'."
            : "Connect your Gmail account to start importing leads from your emails automatically."
          }
        </p>

        {connection.isConnected ? (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="button-secondary flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Unlink className="w-4 h-4" />
            )}
            <span>Disconnect Gmail</span>
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="button-primary flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            <span>Connect Gmail Account</span>
          </button>
        )}

        {/* Connection Benefits */}
        {!connection.isConnected && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Benefits of connecting Gmail:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <span>Automatically import leads from Zillow, Realtor.com, Apartments.com, and RentMarketplace</span>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <span>Process over 4,000 existing emails with one click</span>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <span>Real-time lead updates as new emails arrive</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}