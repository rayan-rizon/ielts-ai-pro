import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MaintenanceScreen = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500"
      data-oid="wsrnirz"
    >
      <Card className="max-w-md w-full shadow-2xl border-primary/20" data-oid="zaq4op7">
        <CardContent className="pt-10 pb-10 text-center space-y-6" data-oid="ittpym1">
          <div className="relative mx-auto w-24 h-24 mb-4" data-oid="ayaxqmd">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
              data-oid="hhwmwri"
            >
              <Settings className="w-24 h-24 text-primary/10" data-oid="4kqw3ut" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center" data-oid="vn7kt2v">
              <AlertTriangle className="w-12 h-12 text-primary" data-oid="ce2-rc2" />
            </div>
          </div>

          <div className="space-y-2" data-oid="q47cfr2">
            <h1 className="text-3xl font-bold tracking-tighter" data-oid="-8napqj">
              Under Maintenance
            </h1>
            <p className="text-muted-foreground text-lg" data-oid="z:tz:::">
              We're currently upgrading our system to serve you better.
            </p>
          </div>

          <div
            className="bg-muted p-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
            data-oid="bdh1eq3"
          >
            <Clock className="w-4 h-4" data-oid="78mlqs0" />
            <span data-oid="tji58v5">Please check back shortly</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceScreen;
