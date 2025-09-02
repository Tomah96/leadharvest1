"use client";

import { useEffect, useRef } from "react";

interface ConsoleOutputProps {
  logs: string[];
  maxHeight?: string;
}

export default function ConsoleOutput({ logs, maxHeight = "400px" }: ConsoleOutputProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (containerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isScrolledToBottom) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [logs]);

  const getLogStyle = (log: string) => {
    // Email parsing headers
    if (log.includes("===== PARSED EMAIL =====") || log.includes("=======================")) {
      return "text-cyan-400 font-bold";
    }
    // Source identifiers with colors
    if (log.includes("Source: Zillow")) {
      return "text-blue-400 font-medium";
    }
    if (log.includes("Source: Realtor")) {
      return "text-green-400 font-medium";
    }
    if (log.includes("Source: Apartments")) {
      return "text-purple-400 font-medium";
    }
    if (log.includes("Source: RentMarketplace")) {
      return "text-orange-400 font-medium";
    }
    // Field labels
    if (log.match(/^\s*(Name|Phone|Email|Property|Move-in|Credit Score|Income|Missing Info|Parsing Errors):/)) {
      return "text-gray-400";
    }
    // Success messages
    if (log.includes("✅") || log.includes("Success") || log.includes("Connected")) {
      return "text-green-400 font-medium";
    }
    // Error messages
    if (log.includes("❌") || log.includes("Error") || log.includes("Failed")) {
      return "text-red-400 font-medium";
    }
    // Warning messages
    if (log.includes("⚠️") || log.includes("Warning") || log.includes("Missing Info:")) {
      return "text-yellow-400";
    }
    // Processing/Loading messages
    if (log.includes("Processing") || log.includes("Fetching") || log.includes("Loading")) {
      return "text-blue-400";
    }
    // Info messages
    if (log.includes("Found") || log.includes("Total") || log.includes("Imported")) {
      return "text-purple-400";
    }
    // OAuth/Connection messages
    if (log.includes("OAuth") || log.includes("authentication")) {
      return "text-cyan-400";
    }
    // Default
    return "text-gray-300";
  };

  const formatLog = (log: string) => {
    // Extract timestamp if present
    const timestampMatch = log.match(/^\[([^\]]+)\]\s*/);
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      const message = log.substring(timestampMatch[0].length);
      return { timestamp, message };
    }
    return { timestamp: null, message: log };
  };

  const formatMessage = (message: string) => {
    // Handle indented content (preserve spacing)
    const indentMatch = message.match(/^(\s+)/);
    if (indentMatch) {
      const spaces = indentMatch[1].replace(/ /g, '\u00A0'); // Non-breaking spaces
      return spaces + message.trim();
    }
    return message;
  };

  return (
    <div 
      ref={containerRef}
      className="bg-gray-900 dark:bg-black text-gray-300 p-4 font-mono text-xs overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      style={{ maxHeight, minHeight: "200px" }}
    >
      {logs.length === 0 ? (
        <div className="text-gray-500">
          <span className="text-gray-600">$</span> <span className="text-gray-500">waiting for activity...</span>
          <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>
        </div>
      ) : (
        <>
          {logs.map((log, index) => {
            const { timestamp, message } = formatLog(log);
            return (
              <div 
                key={index} 
                className="mb-1 hover:bg-gray-800/50 px-1 -mx-1 rounded transition-colors duration-150"
              >
                {timestamp && (
                  <span className="text-gray-600 mr-2">{timestamp}</span>
                )}
                <span className={getLogStyle(message)}>
                  {formatMessage(message)}
                </span>
              </div>
            );
          })}
          <div ref={endRef} className="h-2" />
          <div className="text-gray-600 flex items-center">
            <span>$</span>
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-2"></span>
          </div>
        </>
      )}
    </div>
  );
}