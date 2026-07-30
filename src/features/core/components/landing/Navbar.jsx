import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import SunMedium from 'lucide-react/icons/sun-medium';
import MoonStar from 'lucide-react/icons/moon-star';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Menu from 'lucide-react/icons/menu';
import X from 'lucide-react/icons/x';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/shared/Logo';
import { useScrollProgress } from './useScrollProgress';
import DesktopNavLinks from './DesktopNavLinks';
import MobileNavMenu from './MobileNavMenu';

import Layers from 'lucide-react/icons/layers';
import PenLine from 'lucide-react/icons/pen-line';
import HelpCircle from 'lucide-react/icons/help-circle';
import BookOpen from 'lucide-react/icons/book-open';
import Calculator from 'lucide-react/icons/calculator';
import Tag from 'lucide-react/icons/tag';

const NAV_LINKS = [
  {
    label: 'Platform',
    href: '/#features',
    icon: Layers,
    description: 'Core IELTS AI tools & practice suite',
  },
  {
    label: 'Writing checker',
    href: '/ielts-writing-checker',
    icon: PenLine,
    description: 'Instant Band 9 criteria feedback',
  },
  {
    label: 'How it works',
    href: '/#how-it-works',
    icon: HelpCircle,
    description: 'Learn about our AI evaluation engine',
  },
  {
    label: 'Blog',
    href: '/blog',
    icon: BookOpen,
    description: 'Study guides, strategies & exam tips',
  },
  {
    label: 'Calculator',
    href: '/ielts-band-score-calculator',
    icon: Calculator,
    description: 'Calculate target overall band score',
  },
  {
    label: 'Pricing',
    href: '/#pricing',
    icon: Tag,
    description: 'Flexible access & membership plans',
  },
];

/** Compute Tailwind classes based on scroll state. */
function getNavClasses(isScrolled) {
  return {
    nav: isScrolled ? 'py-2 px-4 sm:px-6 translate-y-0' : 'py-0 px-0 translate-y-0',
    wrapper: isScrolled ? 'max-w-7xl' : 'max-w-full',
    bar: isScrolled
      ? 'h-12 md:h-14 px-4 md:px-5 rounded-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-[0_8px_30px_-10px_rgba(99,102,241,0.15)] dark:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.6)] ring-1 ring-indigo-500/10 dark:ring-white/10'
      : 'h-14 md:h-16 px-4 md:px-6 rounded-none bg-white/75 dark:bg-slate-950/75 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/70 border-t-0 border-x-0',
    glass: isScrolled ? 'rounded-full' : 'rounded-none',
    glassOpacity: isScrolled ? 'opacity-60' : 'opacity-30',
    content: isScrolled ? 'max-w-full' : 'max-w-7xl mx-auto px-2 md:px-8',
  };
}

export default function Navbar({ isDark, setTheme, handlePrimaryCta, isSignedIn }) {
  const { isScrolled, scrollProgress } = useScrollProgress(20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const cls = getNavClasses(isScrolled);

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-[100] transition-all duration-350 ease-out',
        cls.nav
      )}
      data-oid="t9q8_5n"
    >
      <div
        className={cn('mx-auto w-full transition-all duration-350 ease-out', cls.wrapper)}
        data-oid="ol47a-."
      >
        <div
          className={cn(
            'relative flex items-center w-full transition-all duration-350 ease-out',
            cls.bar
          )}
          style={isScrolled ? { borderWidth: '1px' } : undefined}
          data-oid="xp4..v-"
        >
          {/* Glass Reflection Effect */}
          <div
            className={cn(
              'absolute inset-0 overflow-hidden pointer-events-none transition-all duration-350',
              cls.glass
            )}
            data-oid="luem3vp"
          >
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 dark:from-indigo-400/15 dark:via-purple-400/10 dark:to-cyan-400/15 transition-opacity duration-500',
                cls.glassOpacity
              )}
              data-oid="hxrbzv."
            />
          </div>

          {/* Scroll Progress Bar */}
          {isScrolled && (
            <div
              className="absolute bottom-0 left-8 right-8 h-[2px] bg-indigo-500/10 dark:bg-indigo-400/10 overflow-hidden rounded-full"
              data-oid=":fpku4w"
            >
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                style={{ width: `${scrollProgress}%` }}
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
            <Link to={createPageUrl('Index')} className="relative z-[101]" data-oid="6et:210">
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <DesktopNavLinks links={NAV_LINKS} hoveredLink={hoveredLink} onHover={setHoveredLink} />

            <div className="flex items-center gap-2 md:gap-3 relative z-[101]" data-oid="z.sf-4g">
              <Button
                variant="ghost"
                className={cn(
                  'relative h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center p-0',
                  'bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs',
                  'transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer overflow-hidden',
                  isDark
                    ? 'hover:border-indigo-400/50 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] text-indigo-400'
                    : 'hover:border-amber-400/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] text-amber-500'
                )}
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                data-oid="6m:a:wq"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isDark ? 'sun' : 'moon'}
                    initial={{ y: -12, opacity: 0, rotate: -90, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ y: 12, opacity: 0, rotate: 90, scale: 0.6 }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 22,
                    }}
                    className="flex items-center justify-center"
                    data-oid="wdgwl66"
                  >
                    {isDark ? (
                      <SunMedium className="h-4.5 w-4.5 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                    ) : (
                      <MoonStar className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-300 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>

              <Button
                className="hidden sm:inline-flex rounded-full px-5 md:px-6 h-8 md:h-9 text-xs md:text-sm font-extrabold shadow-md shadow-[#6256ef]/20 hover:shadow-lg hover:shadow-[#6256ef]/30 hover:scale-[1.02] active:scale-98 transition-all duration-200 bg-[#6256ef] hover:bg-[#5246e0] text-white border border-[#6256ef]/30 cursor-pointer"
                onClick={handlePrimaryCta}
                data-oid="g5n7eo4"
              >
                {isSignedIn ? 'Dashboard' : 'Start Free'}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden h-8 w-8 flex items-center justify-center p-0 rounded-full bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/80 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400/40 transition-colors shadow-xs"
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
          <MobileNavMenu
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            links={NAV_LINKS}
            isSignedIn={isSignedIn}
            handlePrimaryCta={handlePrimaryCta}
          />
        </div>
      </div>
    </nav>
  );
}
