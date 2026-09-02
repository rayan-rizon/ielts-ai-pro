import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, BookOpen, Search } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between bg-background text-foreground overflow-x-hidden relative selection:bg-primary/20"
      data-oid="3qpj4jq"
    >
      {/* Header with Brand Logo */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <Link to="/" aria-label="IELTS Ai Pro Home">
          <Logo size="md" />
        </Link>
      </header>

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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-linear-to-tr/srgb from-indigo-500/5 via-primary/5 to-purple-500/5 rounded-full blur-3xl"
          data-oid="lmqbe-n"
        />
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-4 py-8 md:px-6"
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
            className="mb-6 relative"
            data-oid="d.2mkwf"
          >
            {/* Glitchy 404 Text Effect */}
            <div
              className="text-[8rem] sm:text-[10rem] md:text-[12rem] font-black leading-none tracking-tighter select-none relative z-10 bg-clip-text text-transparent bg-linear-to-b/srgb from-foreground via-foreground/90 to-foreground/40"
              data-oid="sgm-1ee"
            >
              404
            </div>
            <m.div
              className="absolute top-0 left-0 w-full h-full text-[8rem] sm:text-[10rem] md:text-[12rem] font-black leading-none tracking-tighter text-blue-500/20 blur-sm select-none"
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
              className="absolute top-0 left-0 w-full h-full text-[8rem] sm:text-[10rem] md:text-[12rem] font-black leading-none tracking-tighter text-purple-500/20 blur-sm select-none"
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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-oid="30rpj..">
              Page Not Found
            </h1>
            <p
              className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed"
              data-oid="q7u4::x"
            >
              This page may have moved or no longer exists. Continue with a public IELTS practice
              tool or return to the homepage.
            </p>

            <div
              className="flex flex-wrap gap-3 items-center justify-center mt-8"
              data-oid="6vbkswv"
            >
              <Button
                size="lg"
                variant="default"
                className="h-12 px-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate('/')}
                data-oid="e6ybj2l"
              >
                <Home className="mr-2 w-4 h-4" data-oid="zs8qxyc" />
                Go to homepage
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 bg-background/50 backdrop-blur-sm border hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate('/blog')}
                data-oid="blog-btn"
              >
                <BookOpen className="mr-2 w-4 h-4" />
                IELTS guides
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-6 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate(-1)}
                data-oid="q4uez4m"
              >
                <ArrowLeft className="mr-2 w-4 h-4" data-oid="g.j-o3h" />
                Go Back
              </Button>
            </div>
          </m.div>
        </div>
      </div>

      {/* Decorative footer element */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
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
