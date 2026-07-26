import React from 'react';

/** Desktop navigation pill bar with hover-following highlight. */
export default function DesktopNavLinks({ links, hoveredLink, onHover }) {
  return (
    <div
      className="hidden items-center gap-1 lg:flex bg-muted/40 dark:bg-zinc-900/40 p-1 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md shadow-inner relative"
      data-oid="_3ruemn"
    >
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          onMouseEnter={() => onHover(link.label)}
          onMouseLeave={() => onHover(null)}
          className="relative px-4 py-1.5 rounded-full text-[13px] md:text-sm font-bold tracking-wide text-muted-foreground/80 transition-colors duration-205 hover:text-primary dark:hover:text-white z-10"
          data-oid="b41jq1v"
        >
          {hoveredLink === link.label && (
            <span
              className="absolute inset-0 bg-primary/[0.06] dark:bg-white/[0.08] rounded-full border border-primary/10 dark:border-white/5 shadow-sm"
              data-oid="hover-pill-bg"
            />
          )}
          <span className="relative z-10">{link.label}</span>
        </a>
      ))}
    </div>
  );
}
