"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ShineBorder } from './shine-border';
import { AnimatedGradientText } from './animated-gradient-text';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  variant?: 'default' | 'card' | 'overlay' | 'inline';
  showSpinner?: boolean;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  size = 'medium',
  variant = 'default',
  showSpinner = true,
  showProgress = false,
  progress = 0,
  className = '',
}: LoadingStateProps) {
  // Size classes
  const sizeClasses = {
    small: 'min-h-[100px]',
    medium: 'min-h-[200px]',
    large: 'min-h-[300px]',
    full: 'min-h-full',
  };

  // Spinner sizes
  const spinnerSizes = {
    small: 24,
    medium: 36,
    large: 48,
    full: 48,
  };

  // Variant rendering
  if (variant === 'overlay') {
    return (
      <div className={`absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
        <div className="flex flex-col items-center justify-center p-6">
          {showSpinner && (
            <Loader2 className="animate-spin text-primary mb-4" size={spinnerSizes[size]} />
          )}
          
          <AnimatedGradientText
            text={message}
            className="text-lg font-medium"
            gradient="linear-gradient(to right, var(--primary), var(--accent))"
          />
          
          {showProgress && (
            <div className="w-full max-w-xs mt-4">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center mt-1">
                {progress}%
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showSpinner && (
          <Loader2 className="animate-spin text-primary" size={16} />
        )}
        <span className="text-sm text-muted-foreground">{message}</span>
        
        {showProgress && (
          <div className="w-24 bg-muted rounded-full h-1.5 ml-2">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <ShineBorder
          borderColor="rgba(59, 130, 246, 0.2)"
          shineBorderColor="rgba(59, 130, 246, 0.6)"
          borderRadius="0.75rem"
          className="h-full"
        >
          <div className="bg-card rounded-xl shadow-sm p-6 h-full flex flex-col items-center justify-center">
            {showSpinner && (
              <Loader2 className="animate-spin text-primary mb-4" size={spinnerSizes[size]} />
            )}
            
            <AnimatedGradientText
              text={message}
              className="text-lg font-medium"
              gradient="linear-gradient(to right, var(--primary), var(--accent))"
            />
            
            {showProgress && (
              <div className="w-full max-w-xs mt-4">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {progress}%
                </div>
              </div>
            )}
          </div>
        </ShineBorder>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      {showSpinner && (
        <Loader2 className="animate-spin text-primary mb-4" size={spinnerSizes[size]} />
      )}
      
      <p className="text-muted-foreground">{message}</p>
      
      {showProgress && (
        <div className="w-full max-w-xs mt-4">
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1">
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
}
