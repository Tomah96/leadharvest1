"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // For development, bypass login and redirect to home
    // In production, this would be a real login form
    console.log("Development mode: Bypassing login");
    
    // Set a fake token in localStorage for development
    if (typeof window !== "undefined") {
      localStorage.setItem("dev-mode", "true");
    }
    
    // Redirect to home
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">LeadHarvest CRM</h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Development Mode - Auto-redirecting...
        </p>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ In production, this would be a login form with email/password.
          </p>
        </div>
      </div>
    </div>
  );
}