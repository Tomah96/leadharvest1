"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  Settings, 
  Home,
  Menu,
  X,
  TestTube,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresDatabase?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <Home className="w-5 h-5" />
  },
  {
    label: "Leads",
    href: "/leads",
    icon: <Users className="w-5 h-5" />,
    requiresDatabase: true
  },
  {
    label: "Conversations",
    href: "/conversations",
    icon: <MessageSquare className="w-5 h-5" />,
    requiresDatabase: true
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDatabaseDown, setIsDatabaseDown] = useState(false);

  // Check database availability on mount
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        await api.healthCheck();
        setIsDatabaseDown(false);
      } catch (error: any) {
        if (error?.response?.status === 503 || error?.isDatabaseError) {
          setIsDatabaseDown(true);
        }
      }
    };
    
    checkDatabase();
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          lg:block ${isMobileMenuOpen ? "block" : "hidden"}
          fixed lg:relative top-0 left-0 z-40 lg:z-auto
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-primary-600">LeadHarvest</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Property CRM</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isDisabled = item.requiresDatabase && isDatabaseDown;
                
                return (
                  <li key={item.href}>
                    {isDisabled ? (
                      <div
                        className={`
                          sidebar-item opacity-50 cursor-not-allowed
                          text-gray-500 dark:text-gray-500
                        `}
                        title="Unavailable in Gmail-only mode"
                      >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                        <AlertCircle className="w-4 h-4 ml-auto" />
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          sidebar-item
                          ${isActive ? "sidebar-item-active" : "text-gray-700 dark:text-gray-300"}
                        `}
                      >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
              
              {/* Development only - Gmail Test */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <li>
                    <Link
                      href="/test/gmail"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        sidebar-item
                        ${pathname === '/test/gmail' ? "sidebar-item-active" : "text-gray-700 dark:text-gray-300"}
                      `}
                    >
                      <TestTube className="w-5 h-5" />
                      <span className="font-medium">Gmail Test</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/test/simple"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        sidebar-item
                        ${pathname === '/test/simple' ? "sidebar-item-active" : "text-gray-700 dark:text-gray-300"}
                      `}
                    >
                      <TestTube className="w-5 h-5" />
                      <span className="font-medium">Simple Test</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">A</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">admin@leadharvest.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}