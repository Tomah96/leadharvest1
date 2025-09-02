"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

export function useDatabaseStatus() {
  const [isDatabaseAvailable, setIsDatabaseAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        await api.healthCheck();
        setIsDatabaseAvailable(true);
      } catch (error: any) {
        if (error?.response?.status === 503 || error?.isDatabaseError) {
          setIsDatabaseAvailable(false);
        } else {
          // Other errors don't necessarily mean database is down
          setIsDatabaseAvailable(true);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkDatabaseStatus();
    
    // Recheck every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { isDatabaseAvailable, isChecking };
}