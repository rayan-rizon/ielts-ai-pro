import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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

/**
 * Compute Tailwind classes based on scroll state.
 *
 * Surface colours and border hairlines match the app's actual panel tokens
 * (`#e4e2f0` / `white/[0.10]`, the same pair every dashboard and analytics
 * card uses) rather than generic Tailwind slate — so the navbar reads as the
 * same product as the page underneath it, not a different one glued on top.
 */
function getNavClasses(isScrolled) {
  return {
    nav: isScrolled ? 'py-2 px-4 sm:px-6 translate-y-0' : 'py-0 px-0 translate-y-0',
    wrapper: isScrolled ? 'max-w-7xl' : 'max-w-full',
    bar: isScrolled
      ? 'h-12 md:h-14 px-4 md:px-5 rounded-full bg-white/90 dark:bg-[#131315]/90 backdrop-blur-2xl border border-[#e4e2f0] dark:border-white/10 shadow-sm'
      : 'h-14 md:h-16 px-4 md:px-6 rounded-none bg-white/85 dark:bg-[#0a0a0c]/90 backdrop-blur-2xl border-b border-[#e4e2f0] dark:border-white/8 border-t-0 border-x-0',
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
        'fixed left-0 right-0 top-0 z-100 transition-all duration-350 ease-out',
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
          {/* Scroll progress — a flat brand-tint fill, not a three-hue rainbow
              with a glow. The hairline border already gives the bar its
              elevation; the fill only needs to carry the one signal it's
              actually reporting. */}
          {isScrolled && (
            <div
              className="absolute bottom-0 left-8 right-8 h-[2px] overflow-hidden rounded-full bg-[#5a63df]/10 dark:bg-[#8f97ff]/[0.14]"
              data-oid=":fpku4w"
            >
              <div
                className="h-full bg-[#5a63df] dark:bg-[#8f97ff]"
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
            <Link
              to={createPageUrl('Index')}
              className="relative z-101 shrink-0"
              data-oid="6et:210"
            >
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <DesktopNavLinks links={NAV_LINKS} hoveredLink={hoveredLink} onHover={setHoveredLink} />

            <div className="flex items-center gap-2 md:gap-3 relative z-101" data-oid="z.sf-4g">
              <Button
                variant="ghost"
                className={cn(
                  'relative h-10 w-10 sm:h-9 sm:w-9 rounded-full flex items-center justify-center p-0',
                  'bg-[#f4f3fb] dark:bg-white/5 border border-[#e4e2f0] dark:border-white/10',
                  'transition-all duration-200 ease-sidebar hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer overflow-hidden',
                  'hover:border-[#5a63df]/30 dark:hover:border-[#8f97ff]/30'
                )}
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                data-oid="6m:a:wq"
              >
                <span
                  className="flex items-center justify-center transition-transform duration-200"
                  data-oid="wdgwl66"
                >
                  {isDark ? (
                    <SunMedium className="h-4.5 w-4.5 text-amber-500" />
                  ) : (
                    <MoonStar className="h-4.5 w-4.5 text-[#5a63df] dark:text-[#a9afff]" />
                  )}
                </span>
              </Button>

              <Button
                className="hidden lg:inline-flex rounded-full px-5 md:px-6 h-8 md:h-9 text-xs md:text-sm font-extrabold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 ease-sidebar bg-[#5a63df] hover:bg-[#4a52c9] text-white cursor-pointer"
                onClick={handlePrimaryCta}
                data-oid="g5n7eo4"
              >
                {isSignedIn ? 'Dashboard' : 'Start Free'}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Mobile Menu Toggle — same lift-and-press as the theme toggle
                  beside it (was color-only, the one icon button on this bar
                  with no press feedback at all), plus a hover cue on the
                  glyph itself: the hamburger nudges larger to invite the tap,
                  the X gets a quarter-turn so closing has the same bit of
                  delight opening does. */}
              <button
                className="group lg:hidden h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center p-0 rounded-full bg-[#f4f3fb] dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-[#e4e2f0] dark:border-white/10 hover:bg-[#5a63df]/8 dark:hover:bg-[#8f97ff]/[0.14] hover:text-[#5a63df] dark:hover:text-[#a9afff] hover:border-[#5a63df]/30 dark:hover:border-[#8f97ff]/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 transition-all duration-200 ease-sidebar"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="public-navbar-menu"
                data-oid="bqhg9k2"
              >
                {mobileMenuOpen ? (
                  <X
                    className="h-4.5 w-4.5 transition-transform duration-200 ease-sidebar group-hover:rotate-90"
                    data-oid="h3.9c:4"
                  />
                ) : (
                  <Menu
                    className="h-4.5 w-4.5 transition-transform duration-200 ease-sidebar group-hover:scale-110"
                    data-oid="vli-0_y"
                  />
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
            isScrolled={isScrolled}
          />
        </div>
      </div>
    </nav>
  );
}
