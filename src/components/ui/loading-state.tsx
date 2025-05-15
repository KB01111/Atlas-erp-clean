"use client";

import React from 'react';
import { Loader2, LoaderCircle } from 'lucide-react';
import { ShineBorder } from './shine-border';
import { AnimatedGradientText } from './animated-gradient-text';
import { MagicCard } from '@/components/magicui/magic-card';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  variant?: 'default' | 'card' | 'overlay' | 'inline' | 'fancy';
  showSpinner?: boolean;
  showProgress?: boolean;
  progress?: number;
  className?: string;
  loaderType?: 'spinner' | 'pulse' | 'dots' | 'bounce';
  loaderColor?: string;
}

export function LoadingState({
  message = 'Loading...',
  size = 'medium',
  variant = 'default',
  showSpinner = true,
  showProgress = false,
  progress = 0,
  className = '',
  loaderType = 'spinner',
  loaderColor,
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

  // Custom loader renderer
  const renderLoader = () => {
    const colorClass = loaderColor ? '' : 'text-primary';
    const colorStyle = loaderColor ? { color: loaderColor } : {};

    switch (loaderType) {
      case 'pulse':
        return (
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={colorStyle}
              className={cn("absolute -inset-4 rounded-full bg-primary/20", colorClass)}
            />
            <LoaderCircle
              size={spinnerSizes[size]}
              className={cn("relative", colorClass)}
              style={colorStyle}
            />
          </div>
        );
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                style={colorStyle}
                className={cn(`w-${size === 'small' ? '2' : size === 'medium' ? '3' : '4'} h-${size === 'small' ? '2' : size === 'medium' ? '3' : '4'} rounded-full bg-primary`, colorClass)}
              />
            ))}
          </div>
        );
      case 'bounce':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
                style={colorStyle}
                className={cn(`w-${size === 'small' ? '2' : size === 'medium' ? '3' : '4'} h-${size === 'small' ? '2' : size === 'medium' ? '3' : '4'} rounded-full bg-primary`, colorClass)}
              />
            ))}
          </div>
        );
      case 'spinner':
      default:
        return (
          <Loader2
            className={cn("animate-spin", colorClass)}
            style={colorStyle}
            size={spinnerSizes[size]}
          />
        );
    }
  };

  // Variant rendering
  if (variant === 'overlay') {
    return (
      <div className={cn(`absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50`, className)}>
        <div className="flex flex-col items-center justify-center p-6">
          {showSpinner && (
            <div className="mb-4">
              {renderLoader()}
            </div>
          )}

          <AnimatedGradientText
            text={message}
            className="text-lg font-medium"
            gradient="linear-gradient(to right, var(--primary), var(--accent))"
          />

          {showProgress && (
            <div className="w-full max-w-xs mt-4">
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-primary h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
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
      <div className={cn(`flex items-center gap-2`, className)}>
        {showSpinner && (
          <div className="flex items-center justify-center" style={{ width: '16px', height: '16px' }}>
            {loaderType === 'spinner' ? (
              <Loader2 className="animate-spin text-primary" size={16} />
            ) : loaderType === 'dots' ? (
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    className="w-1 h-1 rounded-full bg-primary"
                  />
                ))}
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
        )}
        <span className="text-sm text-muted-foreground">{message}</span>

        {showProgress && (
          <div className="w-24 bg-muted rounded-full h-1.5 ml-2 overflow-hidden">
            <motion.div
              className="bg-primary h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(`${sizeClasses[size]}`, className)}>
        <ShineBorder
          borderColor="rgba(59, 130, 246, 0.2)"
          shineBorderColor="rgba(59, 130, 246, 0.6)"
          borderRadius="0.75rem"
          className="h-full"
        >
          <div className="bg-card rounded-xl shadow-sm p-6 h-full flex flex-col items-center justify-center">
            {showSpinner && (
              <div className="mb-4">
                {renderLoader()}
              </div>
            )}

            <AnimatedGradientText
              text={message}
              className="text-lg font-medium"
              gradient="linear-gradient(to right, var(--primary), var(--accent))"
            />

            {showProgress && (
              <div className="w-full max-w-xs mt-4">
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-primary h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
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

  // Fancy variant with MagicCard
  if (variant === 'fancy') {
    return (
      <div className={cn(`${sizeClasses[size]}`, className)}>
        <MagicCard
          className="h-full rounded-xl"
          focus
          glare
          glareOpacity={0.2}
        >
          <ShineBorder
            borderRadius="0.75rem"
            className="p-0.5 h-full"
            shineBorderColor="var(--primary)"
          >
            <div className="bg-card rounded-[0.7rem] p-6 h-full flex flex-col items-center justify-center">
              {showSpinner && (
                <div className="mb-4">
                  {renderLoader()}
                </div>
              )}

              <AnimatedGradientText
                text={message}
                className="text-lg font-medium"
                gradient="linear-gradient(to right, var(--primary), var(--accent), var(--primary))"
                duration={3}
              />

              {showProgress && (
                <div className="w-full max-w-xs mt-4">
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-primary h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {progress}%
                  </div>
                </div>
              )}
            </div>
          </ShineBorder>
        </MagicCard>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(`flex flex-col items-center justify-center ${sizeClasses[size]}`, className)}>
      {showSpinner && (
        <div className="mb-4">
          {renderLoader()}
        </div>
      )}

      <p className={`text-muted-foreground ${size === 'small' ? 'text-sm' : 'text-base'}`}>
        {message}
      </p>

      {showProgress && (
        <div className="w-full max-w-xs mt-4">
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-primary h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
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
