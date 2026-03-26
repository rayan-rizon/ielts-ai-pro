import React from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between bg-background text-foreground overflow-x-hidden relative selection:bg-primary/20"
      data-oid="3qpj4jq"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" data-oid="jo:by9w">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2"
          data-oid="95f8zbs"
        />

        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2"
          data-oid="xjcuwsc"
        />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-500/5 via-primary/5 to-purple-500/5 rounded-full blur-3xl"
          data-oid="lmqbe-n"
        />
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-4 py-12 md:px-6"
        data-oid="g:dw823"
      >
        <div
          className="container max-w-3xl mx-auto flex flex-col items-center text-center"
          data-oid="e7xk2vi"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8 relative"
            data-oid="d.2mkwf"
          >
            {/* Glitchy 404 Text Effect */}
            <h1
              className="text-[9rem] md:text-[12rem] font-black leading-none tracking-tighter select-none relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
              data-oid="sgm-1ee"
            >
              404
            </h1>
            <m.div
              className="absolute top-0 left-0 w-full h-full text-[9rem] md:text-[12rem] font-black leading-none tracking-tighter text-blue-500/20 blur-sm select-none"
              animate={{
                x: [-2, 2, -1, 3, -2],
                opacity: [0.5, 0.3, 0.6, 0.2, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              data-oid="d_0uaij"
            >
              404
            </m.div>
            <m.div
              className="absolute top-0 left-0 w-full h-full text-[9rem] md:text-[12rem] font-black leading-none tracking-tighter text-purple-500/20 blur-sm select-none"
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
              data-oid="zabgp0-"
            >
              404
            </m.div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-6"
            data-oid="gk8kion"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" data-oid="30rpj..">
              Page Not Found
            </h2>
            <p
              className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto"
              data-oid="q7u4::x"
            >
              Oops! It seems you've ventured into uncharted territory. The page you're looking for
              has either moved or doesn't exist.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-8"
              data-oid="6vbkswv"
            >
              <Button
                size="lg"
                variant="default"
                className="h-12 px-8 min-w-[160px] shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate('/')}
                data-oid="e6ybj2l"
              >
                <Home className="mr-2 w-4 h-4" data-oid="zs8qxyc" />
                Go Home
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 min-w-[160px] bg-background/50 backdrop-blur-sm border-2 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate(-1)} // Go back to previous page
                data-oid="q4uez4m"
              >
                <ArrowLeft className="mr-2 w-4 h-4" data-oid="g.j-o3h" />
                Go Back
              </Button>
            </div>
          </m.div>
        </div>
      </div>

      {/* Decorative footer element - positioned in flex flow */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="w-full flex justify-center items-center gap-2 text-muted-foreground/60 text-sm py-8 relative z-10"
        data-oid="chrxowi"
      >
        <Search className="w-4 h-4" data-oid="fkfm4cf" />
        <span data-oid="qs3mj6f">Helping you find your way back to success</span>
      </m.div>
    </div>
  );
};

export default NotFound;
