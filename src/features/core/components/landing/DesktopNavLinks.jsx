import React from 'react';

/** Desktop navigation pill bar with hover-following highlight. */
export default function DesktopNavLinks({ links, hoveredLink, onHover }) {
  return (
    <div
      className="hidden items-center gap-1 lg:flex bg-slate-100/70 dark:bg-slate-900/60 p-1 rounded-full border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl shadow-xs relative"
      data-oid="_3ruemn"
    >
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          onMouseEnter={() => onHover(link.label)}
          onMouseLeave={() => onHover(null)}
          className="relative px-4 py-1.5 rounded-full text-[13px] md:text-sm font-bold tracking-wide text-slate-600 dark:text-slate-300 transition-colors duration-200 hover:text-indigo-600 dark:hover:text-indigo-300 z-10"
          data-oid="b41jq1v"
        >
          {hoveredLink === link.label && (
            <span
              className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/15 rounded-full border border-indigo-500/20 dark:border-indigo-400/30 shadow-xs"
              data-oid="hover-pill-bg"
            />
          )}
          <span className="relative z-10">{link.label}</span>
        </a>
      ))}
    </div>
  );
}
