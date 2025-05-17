"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const errorMessageVariants = cva(
  "flex items-start gap-3 rounded-lg",
  {
    variants: {
      size: {
        sm: "p-3 text-sm",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      severity: {
        error: "bg-destructive/10 text-destructive dark:bg-destructive/20",
        warning: "bg-warning/10 text-warning-foreground dark:bg-warning/20",
        info: "bg-info/10 text-info-foreground dark:bg-info/20",
      },
      variant: {
        default: "border",
        card: "",
        alert: "",
        inline: "p-0 bg-transparent",
      },
    },
    defaultVariants: {
      size: "md",
      severity: "error",
      variant: "default",
    },
  }
);

interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorMessageVariants> {
  title?: string;
  message: string;
  actions?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    effect?: "none" | "shimmer" | "glow" | "gradient";
  }[];
  onRetry?: () => void;
  details?: string;
  showDetails?: boolean;
}

export function ErrorMessage({
  title,
  message,
  variant = 'error',
  size = 'medium',
  actions = [],
  onRetry,
  className = '',
  details,
  showDetails = false,
}: ErrorMessageProps) {
  const [isExpanded, setIsExpanded] = React.useState(showDetails);

  // Variant styles
  const variantStyles = {
    error: {
      icon: <XCircle className="text-red-500" size={24} />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      shineBorder: {
        borderColor: 'rgba(239, 68, 68, 0.2)',
        shineBorderColor: 'rgba(239, 68, 68, 0.6)',
      },
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-800 dark:text-amber-200',
      shineBorder: {
        borderColor: 'rgba(245, 158, 11, 0.2)',
        shineBorderColor: 'rgba(245, 158, 11, 0.6)',
      },
    },
    info: {
      icon: <Info className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      shineBorder: {
        borderColor: 'rgba(59, 130, 246, 0.2)',
        shineBorderColor: 'rgba(59, 130, 246, 0.6)',
      },
    },
  };

  // Size classes
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  const currentVariant = variantStyles[variant];

  // Simple version for small size
  if (size === 'small') {
    return (
      <div className={`flex items-center gap-2 ${currentVariant.bgColor} ${currentVariant.textColor} ${sizeClasses[size]} rounded-md ${className}`}>
        {currentVariant.icon}
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto flex items-center gap-1 text-sm hover:underline"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Enhanced version for medium and large sizes
  return (
    <div className={className}>
      <BorderContainer
        borderColor={currentVariant.shineBorder.borderColor}
        shineBorderColor={currentVariant.shineBorder.shineBorderColor}
        borderRadius="0.75rem"
       variant="primary" rounded="xl">
        <div className={`${currentVariant.bgColor} rounded-xl ${sizeClasses[size]}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {currentVariant.icon}
            </div>

            <div className="flex-1">
              {title && (
                <h3 className={`font-semibold mb-1 ${currentVariant.textColor}`}>
                  {title}
                </h3>
              )}

              <p className={`${currentVariant.textColor}`}>
                {message}
              </p>

              {details && (
                <div className="mt-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`text-sm ${currentVariant.textColor} hover:underline flex items-center gap-1`}
                  >
                    {isExpanded ? 'Hide' : 'Show'} details
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-2 bg-white/20 dark:bg-black/20 rounded-md text-sm font-mono overflow-auto max-h-[200px]">
                      {details}
                    </div>
                  )}
                </div>
              )}

              {(actions.length > 0 || onRetry) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md
                        ${variant === 'error' ? 'bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200' :
                          variant === 'warning' ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200' :
                          'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200'
                        }
                        hover:bg-opacity-80 transition-colors
                      `}
                    >
                      <RefreshCw size={14} />
                      Retry
                    </button>
                  )}

                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md
                        ${variant === 'error' ? 'bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200' :
                          variant === 'warning' ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200' :
                          'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200'
                        }
                        hover:bg-opacity-80 transition-colors
                      `}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </BorderContainer>
    </div>
  );
}
