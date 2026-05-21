import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import Brain from 'lucide-react/icons/brain';
import Sun from 'lucide-react/icons/sun';
import Moon from 'lucide-react/icons/moon';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Menu from 'lucide-react/icons/menu';
import X from 'lucide-react/icons/x';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';

export default function Navbar({ isDark, setTheme, handlePrimaryCta, isSignedIn }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { label: 'Features', href: '/#features' },
    { label: 'AI Evaluation', href: '/#showcase' },
    { label: 'Modules', href: '/#modules' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
  ];

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-[100] transition-all duration-500 ease-out py-4',
        isScrolled ? 'translate-y-0' : 'translate-y-2'
      )}
      data-oid="t9q8_5n"
    >
      <div className="mx-auto max-w-7xl px-6 flex justify-center" data-oid="ol47a-.">
        <div
          className={cn(
            'relative flex items-center justify-between w-full h-16 md:h-20 px-4 md:px-6 rounded-full transition-all duration-500',
            isScrolled
              ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-primary/20 dark:border-white/10 shadow-2xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/10'
              : 'bg-white/60 dark:bg-white/5 backdrop-blur-md border-white/60 dark:border-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
          )}
          style={{
            borderWidth: '1px',
          }}
          data-oid="xp4..v-"
        >
          {/* Glass Reflection Effect */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
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
              className="absolute top-0 left-8 right-8 h-[2px] bg-border/20 overflow-hidden rounded-full"
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

          <Link
            to={createPageUrl('Index')}
            className="flex items-center gap-2 sm:gap-3 group relative z-[101]"
            aria-label="IELTS Ai Pro - Home"
            data-oid="6et:210"
          >
            <div className="relative" data-oid="4b8ew.5">
              <div
                className="absolute inset-0 bg-primary/20 blur-lg rounded-full scale-125 group-hover:scale-150 transition-transform duration-500"
                data-oid="06adu2k"
              />

              <div
                className="relative flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3"
                data-oid="--9hiki"
              >
                <Brain className="h-5 w-5 md:h-6 md:w-6" data-oid="94pouab" />
              </div>
            </div>
            <div className="block leading-tight" data-oid="o.3-fm2">
              <div
                className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors"
                data-oid="h2bdh3:"
              >
                IELTS{' '}
                <span className="text-primary italic font-black" data-oid="5au3d2t">
                  Ai
                </span>{' '}
                Pro
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div
            className="hidden items-center gap-1 lg:flex bg-muted/40 dark:bg-zinc-900/40 p-1 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md shadow-inner"
            data-oid="_3ruemn"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative px-5 py-2 rounded-full text-sm font-bold text-muted-foreground transition-all duration-300 hover:text-primary hover:bg-white dark:hover:bg-white/10 hover:shadow-sm"
                data-oid="b41jq1v"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative z-[101]" data-oid="z.sf-4g">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-110 hover:bg-primary/10 hover:text-primary"
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
                    <Sun className="h-5 w-5" data-oid="ybmc88k" />
                  ) : (
                    <Moon className="h-5 w-5" data-oid="ph2qf0-" />
                  )}
                </m.div>
              </AnimatePresence>
            </Button>

            <Button
              className="hidden sm:inline-flex rounded-full px-6 md:px-8 h-10 md:h-11 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-500 hover:-translate-y-1 hover:scale-105 active:scale-95 bg-gradient-to-r from-primary to-blue-600 border-none"
              onClick={handlePrimaryCta}
              data-oid="g5n7eo4"
            >
              {isSignedIn ? 'Dashboard' : 'Get Started'}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-xl bg-muted/50 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              data-oid="bqhg9k2"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" data-oid="h3.9c:4" />
              ) : (
                <Menu className="h-5 w-5" data-oid="vli-0_y" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence data-oid="cfglkhg">
        {mobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-24 left-6 right-6 bg-white dark:bg-card rounded-[2rem] border border-border/50 shadow-2xl p-6 z-[99] overflow-hidden"
            data-oid="iz_alpq"
          >
            <div className="flex flex-col gap-4" data-oid="r6wu019">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-black text-muted-foreground hover:text-primary py-2 transition-colors border-b border-border/10 last:border-0"
                  data-oid="ywl:3a5"
                >
                  {link.label}
                </a>
              ))}
              <Button
                className="w-full rounded-2xl h-14 font-black text-lg mt-4 shadow-xl"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handlePrimaryCta();
                }}
                data-oid="rwj8lbe"
              >
                {isSignedIn ? 'Go to Dashboard' : 'Get Started Now'}
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
