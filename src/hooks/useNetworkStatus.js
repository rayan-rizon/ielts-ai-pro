import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for detecting network connectivity status.
 * Provides real-time updates when the user goes online or offline.
 *
 * @returns {Object} Network status information
 * @returns {boolean} isOnline - Whether the browser has network connectivity
 * @returns {boolean} wasOffline - Whether the user was previously offline (useful for showing reconnection messages)
 * @returns {function} checkConnection - Manual function to check connection status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const wasOfflineTimerRef = useRef(null);
  const offlineSeenRef = useRef(!isOnline);

  // Manual connection check (useful for verifying real connectivity)
  const checkConnection = useCallback(async () => {
    try {
      // Try to fetch a tiny resource to verify actual connectivity
      const response = await fetch('/favicon.svg', {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // User came back online after being offline
      if (offlineSeenRef.current) {
        offlineSeenRef.current = false;
        setWasOffline(true);
        // Reset wasOffline after a delay so UI can show "back online" message
        if (wasOfflineTimerRef.current) clearTimeout(wasOfflineTimerRef.current);
        wasOfflineTimerRef.current = setTimeout(() => setWasOffline(false), 5000);
      }
    };

    const handleOffline = () => {
      offlineSeenRef.current = true;
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (wasOfflineTimerRef.current) clearTimeout(wasOfflineTimerRef.current);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    checkConnection,
  };
}

export default useNetworkStatus;
