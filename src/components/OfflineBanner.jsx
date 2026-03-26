import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * OfflineBanner component - displays a non-intrusive banner when the user loses network connectivity.
 * Shows a "back online" message briefly when connectivity is restored.
 */
export function OfflineBanner() {
  const { isOnline, wasOffline, checkConnection } = useNetworkStatus();
  const [isChecking, setIsChecking] = React.useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    const result = await checkConnection();
    setIsChecking(false);
    if (result) {
      // Force reload to refresh data
      window.location.reload();
    }
  };

  return (
    <AnimatePresence data-oid="9tmylrf">
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-rose-600 to-orange-500 text-white px-4 py-3 shadow-lg"
          data-oid="2vepeas"
        >
          <div
            className="max-w-7xl mx-auto flex items-center justify-between gap-4"
            data-oid="n5.ho:f"
          >
            <div className="flex items-center gap-3" data-oid="-9:glw-">
              <div className="p-2 bg-white/20 rounded-full" data-oid="s.dhefc">
                <WifiOff className="w-5 h-5" data-oid="3x3sv:f" />
              </div>
              <div data-oid="_zujhs8">
                <p className="font-bold text-sm" data-oid="wix0qdn">
                  No Internet Connection
                </p>
                <p className="text-xs text-white/80" data-oid="dv7pf0s">
                  Please check your network and try again.
                </p>
              </div>
            </div>
            <Button
              onClick={handleRetry}
              disabled={isChecking}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-none font-semibold"
              data-oid="z20xepj"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" data-oid="o78dx_f" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" data-oid="mh9mx02" />
              )}
              Retry
            </Button>
          </div>
        </motion.div>
      )}

      {/* Back Online Banner */}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-3 shadow-lg"
          data-oid="34qa1mt"
        >
          <div
            className="max-w-7xl mx-auto flex items-center justify-center gap-3"
            data-oid="kpsm.ff"
          >
            <div className="p-2 bg-white/20 rounded-full" data-oid="08rsrsl">
              <Wifi className="w-5 h-5" data-oid="x2qbdib" />
            </div>
            <div data-oid="29.mf8c">
              <p className="font-bold text-sm" data-oid="5s_dd._">
                Back Online!
              </p>
              <p className="text-xs text-white/80" data-oid="2iu0_fo">
                Your connection has been restored.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
