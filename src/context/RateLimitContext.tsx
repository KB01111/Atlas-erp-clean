import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

interface RateLimitContextType {
  isRateLimited: boolean;
  rateLimitOperation: <T extends (...args: unknown[]) => any>(
    operation: T,
    options?: {
      delay?: number;
      onLimitReached?: () => void;
    }
  ) => (...args: Parameters<T>) => void;
  throttle: <T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ) => Promise<ReturnType<T>>;
}

// Create the context with a default value
const RateLimitContext = createContext<RateLimitContextType>({
  isRateLimited: false,
  rateLimitOperation: () => () => {},
  throttle: async () => undefined as any,
});

// Custom hook to use the rate limit context
export const useRateLimit = () => useContext(RateLimitContext);

interface RateLimitProviderProps {
  children: ReactNode;
  defaultDelay?: number;
}

export const RateLimitProvider: React.FC<RateLimitProviderProps> = ({
  children,
  defaultDelay = 3000,
}) => {
  // State to track if operations are currently rate limited
  const [isRateLimited, setIsRateLimited] = useState(false);
  // State to track the last operation time
  const [lastOperationTime, setLastOperationTime] = useState(0);
  // Ref to track throttled operations by key
  const throttleTimers = useRef<Record<string, number>>({});

  // Function to rate limit an operation
  const rateLimitOperation = useCallback(
    <T extends (...args: unknown[]) => any>(
      operation: T,
      options?: {
        delay?: number;
        onLimitReached?: () => void;
      }
    ) => {
      // Return a wrapped function that applies rate limiting
      return (...args: Parameters<T>) => {
        const now = Date.now();
        const delay = options?.delay || defaultDelay;
        const timeSinceLastOperation = now - lastOperationTime;

        // Check if we're within the rate limit window
        if (isRateLimited || timeSinceLastOperation < delay) {
          console.log(`Operation rate limited. Please wait ${delay - timeSinceLastOperation}ms.`);

          // Call the onLimitReached callback if provided
          if (options?.onLimitReached) {
            options.onLimitReached();
          }

          return;
        }

        // Update the last operation time
        setLastOperationTime(now);
        // Set rate limited state
        setIsRateLimited(true);

        // Execute the operation
        operation(...args);

        // Reset the rate limited state after the delay
        setTimeout(() => {
          setIsRateLimited(false);
        }, delay);
      };
    },
    [isRateLimited, lastOperationTime, defaultDelay]
  );

  // Throttle function implementation
  const throttle = useCallback(
    async <T extends (...args: any[]) => any>(
      key: string,
      fn: T,
      delay: number = defaultDelay
    ): Promise<ReturnType<T>> => {
      const now = Date.now();
      const lastCall = throttleTimers.current[key] || 0;
      const timeSinceLastCall = now - lastCall;

      // If we're within the throttle window, wait for the remaining time
      if (timeSinceLastCall < delay) {
        await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastCall));
      }

      // Update the last call time
      throttleTimers.current[key] = Date.now();

      // Execute the function and return its result
      return fn();
    },
    [defaultDelay]
  );

  // Provide the context value
  const contextValue: RateLimitContextType = {
    isRateLimited,
    rateLimitOperation,
    throttle,
  };

  return (
    <RateLimitContext.Provider value={contextValue}>
      {children}
    </RateLimitContext.Provider>
  );
};

export default RateLimitProvider;
