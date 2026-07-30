import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** Desktop navigation pill bar with hover-following highlight. */
export default function DesktopNavLinks({ links, hoveredLink, onHover }) {
  return (
    <div
      className="hidden items-center gap-1 lg:flex bg-slate-100/80 dark:bg-slate-900/75 p-1 rounded-full border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-2xl shadow-xs hover:border-indigo-500/25 dark:hover:border-indigo-400/30 transition-colors duration-300 relative"
      data-oid="_3ruemn"
    >
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          onMouseEnter={() => onHover(link.label)}
          onMouseLeave={() => onHover(null)}
          className="relative px-4 py-1.5 rounded-full text-[13px] md:text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-300 transition-colors duration-200 hover:text-indigo-600 dark:hover:text-indigo-300 z-10"
          data-oid="b41jq1v"
        >
          <AnimatePresence>
            {hoveredLink === link.label && (
              <motion.span
                layoutId="desktop-nav-hover-pill"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                  opacity: { duration: 0.15 },
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 dark:from-indigo-400/15 dark:via-violet-400/15 dark:to-indigo-400/15 border border-indigo-500/20 dark:border-indigo-400/25 shadow-[0_2px_8px_-2px_rgba(99,102,241,0.14)] pointer-events-none"
                data-oid="hover-pill-bg"
              />
            )}
          </AnimatePresence>
          <span className="relative z-10">{link.label}</span>
        </a>
      ))}
    </div>
  );
}
