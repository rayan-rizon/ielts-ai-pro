import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Desktop navigation pill bar with hover-following highlight.
 *
 * The hover pill used to be a three-stop indigo→violet→indigo gradient with
 * its own colour-glow shadow — a different purple than the brand's `#5a63df`,
 * layered under a second `backdrop-blur` on top of the navbar's own blur.
 * One flat brand-tint fill and one blur layer does the same job.
 */
export default function DesktopNavLinks({ links, hoveredLink, onHover }) {
  return (
    <div
      className="relative hidden items-center gap-1 rounded-full border border-[#e4e2f0] bg-[#f4f3fb] p-1 transition-colors duration-300 dark:border-white/8 dark:bg-white/4 lg:flex"
      data-oid="_3ruemn"
    >
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          onMouseEnter={() => onHover(link.label)}
          onMouseLeave={() => onHover(null)}
          className="relative z-10 rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-tight text-slate-600 transition-colors duration-200 hover:text-[#5a63df] dark:text-slate-300 dark:hover:text-[#a9afff] md:text-sm"
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
                className="absolute inset-0 rounded-full border border-[#5a63df]/20 bg-[#5a63df]/8 pointer-events-none dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.14]"
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
