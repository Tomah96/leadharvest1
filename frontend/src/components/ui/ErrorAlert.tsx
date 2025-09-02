import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  actionText?: string;
  onAction?: () => void;
}

export default function ErrorAlert({ message, onClose, actionText, onAction }: ErrorAlertProps) {
  return (
    <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-gray-100">{message}</p>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="mt-2 text-sm font-medium text-error hover:text-error/80"
          >
            {actionText}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}