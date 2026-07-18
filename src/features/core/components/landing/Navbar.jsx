import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';

import Sun from 'lucide-react/icons/sun';
import Moon from 'lucide-react/icons/moon';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Menu from 'lucide-react/icons/menu';
import X from 'lucide-react/icons/x';
import ChevronRight from 'lucide-react/icons/chevron-right';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/shared/Logo';

export default function Navbar({ isDark, setTheme, handlePrimaryCta, isSignedIn }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          setIsScrolled(scrolled);

          // Calculate scroll progress
          const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
          const height =
            document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (height > 0) {
            const scrolled_pct = (winScroll / height) * 100;
            setScrollProgress(scrolled_pct);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', href: '/#features' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Calculator', href: '/ielts-band-score-calculator' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
  ];

  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.3,
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
  };

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-[100] transition-all duration-350 ease-out',
        isScrolled ? 'py-2 px-6 translate-y-0' : 'py-0 px-0 translate-y-0'
      )}
      data-oid="t9q8_5n"
    >
      <div
        className={cn(
          'mx-auto w-full transition-all duration-350 ease-out',
          isScrolled ? 'max-w-7xl' : 'max-w-full'
        )}
        data-oid="ol47a-."
      >
        <div
          className={cn(
            'relative flex items-center w-full transition-all duration-350 ease-out',
            isScrolled
              ? 'h-12 md:h-14 px-3 md:px-5 rounded-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-lg shadow-black/[0.03] ring-1 ring-black/5 dark:ring-white/10'
              : 'h-14 md:h-16 px-0 rounded-none bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-b border-black/5 dark:border-white/5 border-t-0 border-x-0'
          )}
          style={isScrolled ? { borderWidth: '1px' } : undefined}
          data-oid="xp4..v-"
        >
          {/* Glass Reflection Effect */}
          <div
            className={cn(
              'absolute inset-0 overflow-hidden pointer-events-none transition-all duration-350',
              isScrolled ? 'rounded-full' : 'rounded-none'
            )}
            data-oid="luem3vp"
          >
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent transition-opacity duration-500',
                isScrolled ? 'opacity-40' : 'opacity-20'
              )}
              data-oid="hxrbzv."
            />
          </div>

          {/* Scroll Progress Bar */}
          {isScrolled && (
            <div
              className="absolute bottom-0 left-8 right-8 h-[2px] bg-border/20 overflow-hidden rounded-full"
              data-oid=":fpku4w"
            >
              <m.div
                className="h-full bg-gradient-to-r from-primary to-violet-500 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${scrollProgress}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                data-oid="yu2y4lq"
              />
            </div>
          )}

          {/* Centered Content Wrapper */}
          <div
            className={cn(
              'flex items-center justify-between w-full transition-all duration-350 ease-out z-10',
              isScrolled ? 'max-w-full' : 'max-w-7xl mx-auto px-6 md:px-8'
            )}
          >
            <Link
              to={createPageUrl('Index')}
              className="relative z-[101]"
              aria-label="IELTS Ai Pro - Home"
              data-oid="6et:210"
            >
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <div
              className="hidden items-center gap-1 lg:flex bg-muted/40 dark:bg-zinc-900/40 p-1 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md shadow-inner relative"
              data-oid="_3ruemn"
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.label)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="relative px-4 py-1.5 rounded-full text-[13px] md:text-sm font-bold tracking-wide text-muted-foreground/80 transition-colors duration-205 hover:text-primary dark:hover:text-white z-10"
                  data-oid="b41jq1v"
                >
                  {hoveredLink === link.label && (
                    <m.span
                      layoutId="nav-hover-pill"
                      className="absolute inset-0 bg-primary/[0.06] dark:bg-white/[0.08] rounded-full border border-primary/10 dark:border-white/5 shadow-sm"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      data-oid="hover-pill-bg"
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-3 relative z-[101]" data-oid="z.sf-4g">
              <Button
                variant="ghost"
                className="h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center p-0 hover:bg-primary/5 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95 text-muted-foreground hover:text-primary dark:hover:text-white"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                data-oid="6m:a:wq"
              >
                <AnimatePresence mode="wait" data-oid="_k2b_9p">
                  <m.div
                    key={isDark ? 'dark' : 'light'}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    data-oid="wdgwl66"
                  >
                    {isDark ? (
                      <Sun className="h-4.5 w-4.5" data-oid="ybmc88k" />
                    ) : (
                      <Moon className="h-4.5 w-4.5" data-oid="ph2qf0-" />
                    )}
                  </m.div>
                </AnimatePresence>
              </Button>

              <Button
                className="hidden sm:inline-flex rounded-full px-5 md:px-6 h-8 md:h-9 text-xs md:text-sm font-semibold shadow-md shadow-primary/10 hover:shadow-primary/25 hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:-translate-y-[1px] hover:scale-[1.02] active:scale-98 transition-all duration-300 bg-gradient-to-r from-violet-600 via-primary to-indigo-600 text-white border-none"
                onClick={handlePrimaryCta}
                data-oid="g5n7eo4"
              >
                {isSignedIn ? 'Dashboard' : 'Start Free'}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden h-8 w-8 flex items-center justify-center p-0 rounded-full bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                data-oid="bqhg9k2"
              >
                {mobileMenuOpen ? (
                  <X className="h-4.5 w-4.5" data-oid="h3.9c:4" />
                ) : (
                  <Menu className="h-4.5 w-4.5" data-oid="vli-0_y" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence data-oid="cfglkhg">
            {mobileMenuOpen && (
              <m.div
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="lg:hidden absolute top-full left-4 right-4 mt-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-5 z-[99] overflow-hidden"
                data-oid="iz_alpq"
              >
                <m.div className="flex flex-col gap-1.5" data-oid="r6wu019">
                  {navLinks.map((link) => (
                    <m.a
                      variants={itemVariants}
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group text-sm font-bold tracking-wide text-muted-foreground/80 hover:text-primary dark:hover:text-white py-2.5 px-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 last:border-0 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                      data-oid="ywl:3a5"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                    </m.a>
                  ))}
                  <m.div variants={itemVariants} className="pt-2">
                    <Button
                      className="w-full rounded-full h-10 text-sm font-bold shadow-md bg-gradient-to-r from-violet-600 via-primary to-indigo-600 text-white mt-1 border-none"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handlePrimaryCta();
                      }}
                      data-oid="rwj8lbe"
                    >
                      {isSignedIn ? 'Go to Dashboard' : 'Start Free Practice'}
                    </Button>
                  </m.div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
