"use client";

import React from 'react';
import { ShineBorder } from './shine-border';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { MagicCard } from '@/components/magicui/magic-card';
import { AnimatedGradientText } from './animated-gradient-text';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'card' | 'fancy';
  className?: string;
  iconClassName?: string;
  animateIcon?: boolean;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  size = 'medium',
  variant = 'default',
  className = '',
  iconClassName = '',
  animateIcon = true,
}: EmptyStateProps) {
  // Size classes
  const sizeClasses = {
    small: 'min-h-[100px] p-4',
    medium: 'min-h-[200px] p-6',
    large: 'min-h-[300px] p-8',
  };

  // Icon sizes
  const iconSizes = {
    small: 32,
    medium: 48,
    large: 64,
  };

  // Content
  const content = (
    <div className="flex flex-col items-center justify-center text-center">
      {Icon && (
        <div className={cn("mb-4", iconClassName)}>
          {animateIcon ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-muted-foreground/40"
            >
              <Icon
                size={iconSizes[size]}
                strokeWidth={1.5}
              />
            </motion.div>
          ) : (
            <Icon
              size={iconSizes[size]}
              className="text-muted-foreground/40"
              strokeWidth={1.5}
            />
          )}
        </div>
      )}

      {variant === 'fancy' ? (
        <AnimatedGradientText
          text={title}
          className={`font-medium ${size === 'small' ? 'text-base' : size === 'medium' ? 'text-lg' : 'text-xl'}`}
          gradient="linear-gradient(to right, var(--primary), var(--accent))"
        />
      ) : (
        <h3 className={`font-medium text-foreground ${size === 'small' ? 'text-base' : size === 'medium' ? 'text-lg' : 'text-xl'}`}>
          {title}
        </h3>
      )}

      {description && (
        <p className={`text-muted-foreground mt-2 max-w-md ${size === 'small' ? 'text-sm' : 'text-base'}`}>
          {description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {action && (
          <ShimmerButton
            onClick={action.onClick}
            className={`px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground ${
              size === 'small' ? 'text-sm' : 'text-base'
            }`}
          >
            {action.label}
          </ShimmerButton>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className={`px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors ${
              size === 'small' ? 'text-sm' : 'text-base'
            }`}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );

  // Card variant
  if (variant === 'card') {
    return (
      <div className={cn(className)}>
        <ShineBorder
          borderColor="rgba(59, 130, 246, 0.2)"
          shineBorderColor="rgba(59, 130, 246, 0.6)"
          borderRadius="0.75rem"
          className="h-full"
        >
          <div className={`bg-card rounded-xl shadow-sm ${sizeClasses[size]} h-full flex items-center justify-center`}>
            {content}
          </div>
        </ShineBorder>
      </div>
    );
  }

  // Fancy variant
  if (variant === 'fancy') {
    return (
      <MagicCard
        className={cn(`rounded-lg h-full`, className)}
        focus
        glare
        glareOpacity={0.2}
      >
        <ShineBorder
          borderRadius="0.75rem"
          className="p-0.5 h-full"
          shineBorderColor="var(--primary)"
        >
          <div className={`bg-card text-card-foreground rounded-[0.7rem] ${sizeClasses[size]} h-full flex items-center justify-center`}>
            {content}
          </div>
        </ShineBorder>
      </MagicCard>
    );
  }

  // Default variant
  return (
    <div className={cn(`${sizeClasses[size]} flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg`, className)}>
      {content}
    </div>
  );
}
