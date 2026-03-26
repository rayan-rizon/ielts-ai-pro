import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, RefreshCcw, AlertOctagon } from 'lucide-react';

const Error500 = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between bg-background text-foreground overflow-x-hidden relative selection:bg-primary/20"
      data-oid="gb1rog2"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" data-oid="zbeeeen">
        <div
          className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2"
          data-oid="5gp5y5i"
        />

        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2"
          data-oid="ax-.gg7"
        />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-red-500/5 via-orange-500/5 to-yellow-500/5 rounded-full blur-3xl"
          data-oid="w51dguw"
        />
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-4 py-12 md:px-6"
        data-oid="2yhgk2o"
      >
        <div
          className="container max-w-3xl mx-auto flex flex-col items-center text-center"
          data-oid="8.av:f5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8 relative"
            data-oid="ads::wu"
          >
            {/* Glitchy 500 Text Effect */}
            <h1
              className="text-[9rem] md:text-[12rem] font-black leading-none tracking-tighter select-none relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
              data-oid="xhyet-l"
            >
              500
            </h1>
            <motion.div
              className="absolute top-0 left-0 w-full h-full text-[9rem] md:text-[12rem] font-black leading-none tracking-tighter text-red-500/20 blur-sm select-none"
              animate={{
                x: [-2, 2, -1, 3, -2],
                opacity: [0.5, 0.3, 0.6, 0.2, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              data-oid="9ui_8zw"
            >
              500
            </motion.div>
            <motion.div
              className="absolute top-0 left-0 w-full h-full text-[9rem] md:text-[12rem] font-black leading-none tracking-tighter text-orange-500/20 blur-sm select-none"
              animate={{
                x: [2, -2, 1, -3, 2],
                opacity: [0.3, 0.5, 0.2, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.2,
              }}
              data-oid="pfteogr"
            >
              500
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-6"
            data-oid="gf2rzwg"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" data-oid="k-xdqbo">
              Internal Server Error
            </h2>
            <p
              className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto"
              data-oid="b:y8by6"
            >
              It seems something went wrong on our end. We're tracking the error and working to fix
              it.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-8"
              data-oid="y17aexc"
            >
              <Button
                size="lg"
                variant="default"
                className="h-12 px-8 min-w-[160px] shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate('/')}
                data-oid="bxu5y6p"
              >
                <Home className="mr-2 w-4 h-4" data-oid="qiiw09l" />
                Go Home
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 min-w-[160px] bg-background/50 backdrop-blur-sm border-2 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => window.location.reload()}
                data-oid="ud589pg"
              >
                <RefreshCcw className="mr-2 w-4 h-4" data-oid="n53nlx_" />
                Try Again
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative footer element */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="w-full flex justify-center items-center gap-2 text-muted-foreground/60 text-sm py-8 relative z-10"
        data-oid="db.4os9"
      >
        <AlertOctagon className="w-4 h-4" data-oid="bc5d5hj" />
        <span data-oid="x08b1o8">Our team has been notified of this issue</span>
      </motion.div>
    </div>
  );
};

export default Error500;
