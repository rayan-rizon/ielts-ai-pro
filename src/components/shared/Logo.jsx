import React from 'react';
import { cn } from '@/lib/cn';

// Intrinsic size of logo.svg / footer.svg. Declared on the <img> tags so the
// browser can reserve the right box before the file loads; the Tailwind height
// classes still decide the rendered size.
const LOGO_WIDTH = 300;
const LOGO_HEIGHT = 72;

// Lighthouse measures this logo as the LCP element on the landing page, so it
// gets the browser's top image priority. Spread as a lowercase attribute rather
// than written as a JSX prop: React 18 forwards the HTML-standard lowercase
// name untouched, while the camel-cased `fetchPriority` prop it would warn
// about is only mapped in later React versions. Same approach as the hero
// artwork in landing/HeroSection.jsx.
const logoPriorityProps = { fetchpriority: 'high' };

export function LogoIcon({ className = 'w-8 h-8', variant = 'auto' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 72 72"
      fill="none"
      role="img"
      aria-label="Animated IELTS AI Pro Monogram"
      shapeRendering="geometricPrecision"
      className={cn('shrink-0 select-none overflow-visible', className)}
    >
      <defs>
        <linearGradient
          id="slashGradient"
          x1="198"
          y1="154"
          x2="316"
          y2="74"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6C4CFF" />
          <stop offset="1" stopColor="#A977FF" />
        </linearGradient>
        <linearGradient
          id="legGradient"
          x1="235"
          y1="155"
          x2="305"
          y2="253"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#A977FF" />
          <stop offset="0.55" stopColor="#7D55FF" />
          <stop offset="1" stopColor="#6C4CFF" />
        </linearGradient>
        <filter id="softGlow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0.50 0 0 0 0.18
                    0 0.30 0 0 0.08
                    0 0 0.95 0 0.55
                    0 0 0 0.30 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{`
        .logo-motion {
          transform-box: fill-box;
          transform-origin: center;
          animation: logo-in 700ms cubic-bezier(.2,.8,.2,1) both, logo-float 4s ease-in-out 1.1s infinite;
        }
        .purple-leg {
          transform-box: fill-box;
          transform-origin: center;
          animation: leg-pulse 3.2s ease-in-out 1.1s infinite;
        }
        .upward-slash {
          transform-box: fill-box;
          transform-origin: left center;
          filter: url(#softGlow);
          animation: slash-in 850ms cubic-bezier(.16,1,.3,1) 180ms both, slash-breathe 3.2s ease-in-out 1.2s infinite;
        }
        @keyframes logo-in {
          0% { opacity: 0; transform: translateY(4px) scale(.93); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slash-in {
          0% { opacity: 0; transform: translate(-18px, 12px) scaleX(.45) rotate(-3deg); }
          100% { opacity: 1; transform: translate(0, 0) scaleX(1) rotate(0deg); }
        }
        @keyframes logo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.2px); }
        }
        @keyframes leg-pulse {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: .92; transform: translateY(-.8px); }
        }
        @keyframes slash-breathe {
          0%, 100% { opacity: .96; transform: translate(0, 0) scaleX(1); }
          50% { opacity: 1; transform: translate(1.2px, -1px) scaleX(1.035); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-motion, .purple-leg, .upward-slash { animation: none; }
        }
      `}</style>

      <g transform="translate(4.5 5) scale(0.24137931) translate(-55 -21)">
        <g className="logo-motion">
          <path
            d="M211 21 L160 22 L55 252 L125 252 L207 173 L195 146 L151 173 L145 174 L185 82 L205 127 L249 103 Z"
            className={cn(
              variant === 'dark' || variant === 'footer'
                ? 'fill-[#F7F8FF]'
                : variant === 'light'
                  ? 'fill-[#0B0E2A]'
                  : 'fill-[#0B0E2A] dark:fill-[#F7F8FF]'
            )}
          />
          <path
            className="purple-leg"
            d="M265 139 L223 179 L257 253 L316 253 L311 238 Z"
            fill="url(#legGradient)"
          />
          <path
            className="upward-slash"
            d="M316 74 L198 144 L198 149 L208 172 Z"
            fill="url(#slashGradient)"
          />
        </g>
      </g>
    </svg>
  );
}

export function Logo({
  className,
  iconOnly = false,
  variant = 'auto', // 'auto' | 'light' | 'dark' | 'footer'
  size = 'md',
  animated = true,
}) {
  const sizeClasses = {
    sm: { height: 'h-6 sm:h-7', icon: 'w-7 h-7' },
    md: { height: 'h-8 sm:h-9', icon: 'w-8 h-8 sm:w-9 sm:h-9' },
    lg: { height: 'h-10 sm:h-11', icon: 'w-10 h-10 sm:w-11 sm:h-11' },
    xl: { height: 'h-12 sm:h-14', icon: 'w-12 h-12 sm:w-14 sm:h-14' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (iconOnly) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 transition-transform duration-300',
          animated && 'hover:scale-105 hover:rotate-3',
          currentSize.icon,
          className
        )}
      >
        <LogoIcon className={currentSize.icon} variant={variant} />
      </div>
    );
  }

  // Force dark logo (footer.svg) for variant="dark" or variant="footer"
  if (variant === 'dark' || variant === 'footer') {
    return (
      <div className={cn('inline-flex items-center group select-none cursor-pointer', className)}>
        <img
          src="/footer.svg"
          alt="IELTS AI Pro Logo"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          className={cn(
            'w-auto object-contain transition-transform duration-300',
            animated && 'group-hover:scale-[1.03]',
            currentSize.height
          )}
        />
      </div>
    );
  }

  // Force light logo (logo.svg) for variant="light"
  if (variant === 'light') {
    return (
      <div className={cn('inline-flex items-center group select-none cursor-pointer', className)}>
        <img
          src="/logo.svg"
          alt="IELTS AI Pro Logo"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          {...logoPriorityProps}
          className={cn(
            'w-auto object-contain transition-transform duration-300',
            animated && 'group-hover:scale-[1.03]',
            currentSize.height
          )}
        />
      </div>
    );
  }

  // Responsive / Theme-aware (auto): logo.svg on light theme, footer.svg on dark theme
  return (
    <div className={cn('inline-flex items-center group select-none cursor-pointer', className)}>
      <img
        src="/logo.svg"
        alt="IELTS AI Pro Logo"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        {...logoPriorityProps}
        className={cn(
          'dark:hidden w-auto object-contain transition-transform duration-300',
          animated && 'group-hover:scale-[1.03]',
          currentSize.height
        )}
      />
      <img
        src="/footer.svg"
        alt="IELTS AI Pro Logo"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={cn(
          'hidden dark:block w-auto object-contain transition-transform duration-300',
          animated && 'group-hover:scale-[1.03]',
          currentSize.height
        )}
      />
    </div>
  );
}
