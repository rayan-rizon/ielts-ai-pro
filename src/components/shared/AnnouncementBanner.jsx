import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Bell, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AnnouncementBanner = ({ message, type = 'info' }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!message || !isVisible) return null;

  const styles = {
    info: 'bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-500/20',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600 border-b border-orange-500/20',
    error: 'bg-gradient-to-r from-red-600 to-rose-600 border-b border-red-500/20',
  };

  const icons = {
    info: Info,
    warning: AlertCircle,
    error: Bell,
  };

  const Icon = icons[type] || icons.info;

  return (
    <AnimatePresence data-oid="squ::q3">
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={cn(
            'w-full text-white relative z-[100] shadow-lg',
            styles[type] || styles.info
          )}
          data-oid="g2e9z0m"
        >
          <div
            className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto"
            data-oid="uf6-knd"
          >
            <div className="flex items-center gap-3 flex-1 justify-center" data-oid="q8b1z36">
              <span
                className="p-1.5 bg-white/20 rounded-full shrink-0 animate-pulse"
                data-oid="weshhj5"
              >
                <Icon className="w-4 h-4 text-white" data-oid="ncv_mn7" />
              </span>
              <span className="text-sm font-medium tracking-wide drop-shadow-sm" data-oid="m1xi48p">
                {message}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20 rounded-full shrink-0"
              onClick={() => setIsVisible(false)}
              data-oid="c5vdo_b"
            >
              <X className="w-4 h-4" data-oid="077eth-" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
