"use client";

import { useState, useEffect } from "react";
import { 
  Mail, 
  PlayCircle, 
  PauseCircle, 
  StopCircle, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  BarChart
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { BatchProcess } from "@/types";

export default function BatchProcessor() {
  const [process, setProcess] = useState<BatchProcess>({
    id: "",
    total: 0,
    processed: 0,
    failed: 0,
    status: 'idle',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing batch process
    checkBatchStatus();
  }, []);

  useEffect(() => {
    // Poll for updates when processing
    if (process.status === 'running') {
      const interval = setInterval(checkBatchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [process.status]);

  const checkBatchStatus = async () => {
    try {
      const response = await api.gmail.getBatchStatus();
      setProcess(response.data);
    } catch (err) {
      // No active batch process
      console.log("No active batch process");
    }
  };

  const startBatchProcess = async () => {
    if (!confirm("This will process over 4,000 emails and may take several hours. Continue?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.gmail.startBatchProcess();
      setProcess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to start batch processing");
    } finally {
      setLoading(false);
    }
  };

  const pauseBatchProcess = async () => {
    setLoading(true);
    try {
      const response = await api.gmail.pauseBatchProcess();
      setProcess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to pause batch processing");
    } finally {
      setLoading(false);
    }
  };

  const resumeBatchProcess = async () => {
    setLoading(true);
    try {
      const response = await api.gmail.resumeBatchProcess();
      setProcess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to resume batch processing");
    } finally {
      setLoading(false);
    }
  };

  const stopBatchProcess = async () => {
    if (!confirm("Are you sure you want to stop the batch process? You can restart it later.")) {
      return;
    }

    setLoading(true);
    try {
      await api.gmail.stopBatchProcess();
      setProcess({
        id: "",
        total: 0,
        processed: 0,
        failed: 0,
        status: 'idle',
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to stop batch processing");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = process.total > 0 
    ? Math.round((process.processed / process.total) * 100) 
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Batch Email Processing
      </h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {process.status === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Process your existing Gmail inbox to import all historical lead emails.
          </p>

          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-warning">
                  Large Operation Warning
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  This will process over 4,000 emails and may take several hours. 
                  The process runs in the background and you can pause or stop it at any time.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startBatchProcess}
            disabled={loading}
            className="button-primary flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            <span>Start Batch Processing</span>
          </button>
        </div>
      )}

      {process.status !== 'idle' && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Processing emails...</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {process.processed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Processed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {process.total - process.processed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Remaining
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error">
                {process.failed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Failed
              </div>
            </div>
          </div>

          {/* Status and Time */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {process.status === 'running' && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-600 dark:text-green-400">Running</span>
                </>
              )}
              {process.status === 'paused' && (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-yellow-600 dark:text-yellow-400">Paused</span>
                </>
              )}
              {process.status === 'completed' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Completed</span>
                </>
              )}
              {process.status === 'failed' && (
                <>
                  <AlertTriangle className="w-4 h-4 text-error" />
                  <span className="text-error">Failed</span>
                </>
              )}
            </div>

            {process.estimatedTimeRemaining && process.status === 'running' && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>~{formatTime(process.estimatedTimeRemaining)} remaining</span>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-3">
            {process.status === 'running' && (
              <>
                <button
                  onClick={pauseBatchProcess}
                  disabled={loading}
                  className="button-secondary flex items-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PauseCircle className="w-4 h-4" />
                  )}
                  <span>Pause</span>
                </button>
                <button
                  onClick={stopBatchProcess}
                  disabled={loading}
                  className="button-secondary text-error border-error hover:bg-error/10 flex items-center space-x-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {process.status === 'paused' && (
              <>
                <button
                  onClick={resumeBatchProcess}
                  disabled={loading}
                  className="button-primary flex items-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4" />
                  )}
                  <span>Resume</span>
                </button>
                <button
                  onClick={stopBatchProcess}
                  disabled={loading}
                  className="button-secondary text-error border-error hover:bg-error/10 flex items-center space-x-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {process.status === 'completed' && (
              <button
                onClick={() => setProcess({ ...process, status: 'idle' })}
                className="button-secondary flex items-center space-x-2"
              >
                <BarChart className="w-4 h-4" />
                <span>View Report</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}