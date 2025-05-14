import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RateLimitContextType {
  isRateLimited: boolean;
  rateLimitOperation: <T extends (...args: any[]) => any>(
    operation: T,
    options?: {
      delay?: number;
      onLimitReached?: () => void;
    }
  ) => (...args: Parameters<T>) => void;
}

// Create the context with a default value
const RateLimitContext = createContext<RateLimitContextType>({
  isRateLimited: false,
  rateLimitOperation: () => () => {},
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

  // Function to rate limit an operation
  const rateLimitOperation = useCallback(
    <T extends (...args: any[]) => any>(
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

  // Provide the context value
  const contextValue: RateLimitContextType = {
    isRateLimited,
    rateLimitOperation,
  };

  return (
    <RateLimitContext.Provider value={contextValue}>
      {children}
    </RateLimitContext.Provider>
  );
};

export default RateLimitProvider;
