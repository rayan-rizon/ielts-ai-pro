import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Sparkles, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ITEM_VARIANTS } from '../constants';

const LockedFeature = ({ isLocked, children }) => {
  if (!isLocked) return children;

  return (
    <div className="relative group/locked" data-oid="6j34k-l">
      <div
        className="blur-[8px] select-none pointer-events-none opacity-40 transition-all duration-500 scale-[0.98]"
        data-oid="2p4:12h"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-6" data-oid="ch1so.2">
        <div className="text-center space-y-3" data-oid="4fva736">
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 mx-auto"
            data-oid="lym:3ad"
          >
            <Lock className="w-5 h-5" data-oid="92sjgyz" />
          </div>
          <div className="space-y-1" data-oid="bha97w4">
            <div className="text-sm font-black text-foreground tracking-tight" data-oid="a-_nxyw">
              Unlock Advanced Analytics
            </div>
            <p
              className="text-[10px] font-medium text-muted-foreground leading-relaxed"
              data-oid="5q4r5g."
            >
              Get detailed insights, error patterns, and personalized strategies
            </p>
          </div>
          <Badge
            className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            data-oid="nqeu5ks"
          >
            Upgrade to Pro
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default function DeepDiveAccordion({ isPremium, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div variants={ITEM_VARIANTS} data-oid="r6bx513">
      <Card
        className="w-full rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden hover:shadow-xl transition-all"
        data-oid="8we2egr"
      >
        <CardHeader
          className="cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          data-oid="j2kkz3t"
        >
          <div className="flex items-center justify-between" data-oid="ern:nyk">
            <div className="flex items-center gap-3" data-oid="05lelzu">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500" data-oid="-33nb72">
                <Sparkles className="w-4 h-4" data-oid="ws:ofpo" />
              </div>
              <div data-oid=".d8f-zm">
                <CardTitle
                  className="text-lg font-black text-foreground flex items-center gap-2"
                  data-oid="3f4tner"
                >
                  Deep Dive Analytics
                  <Badge
                    variant="secondary"
                    className="rounded-xl bg-primary/10 text-primary border-0 font-black text-[10px] uppercase tracking-widest px-2"
                    data-oid="e6i:o76"
                  >
                    Advanced
                  </Badge>
                </CardTitle>
                <CardDescription
                  className="font-semibold text-xs leading-relaxed"
                  data-oid="iycpgr-"
                >
                  Detailed insights, error patterns, and personalized strategies
                </CardDescription>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              data-oid="lwraz06"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" data-oid="gp5326n" />
            </motion.div>
          </div>
        </CardHeader>

        <AnimatePresence data-oid="7pupgon">
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
              data-oid="f_o4xpk"
            >
              <CardContent className="pt-0 space-y-6" data-oid="vq7m0my">
                <LockedFeature isLocked={!isPremium} data-oid="6qey.wm">
                  {children}
                </LockedFeature>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
