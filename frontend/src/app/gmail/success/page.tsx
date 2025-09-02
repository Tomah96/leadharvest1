"use client";

import { useEffect } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GmailSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Close the window if it was opened as a popup
    if (window.opener) {
      // Notify the parent window
      window.opener.postMessage({ type: 'gmail-auth-success' }, window.location.origin);
      
      // Close after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      // If not a popup, redirect to settings after delay
      setTimeout(() => {
        router.push('/settings/gmail');
      }, 3000);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full px-6">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Gmail Connected Successfully!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your Gmail account has been connected to LeadHarvest. 
            You can now import leads from your emails.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link 
              href="/settings/gmail" 
              className="button-primary w-full flex items-center justify-center space-x-2"
            >
              <span>Go to Gmail Settings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              This window will close automatically...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}