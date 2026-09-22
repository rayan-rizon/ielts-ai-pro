import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/features/core/components/landing/Navbar';
import Footer from '@/features/core/components/landing/Footer';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';

/**
 * Shell for the public legal documents (privacy, terms, and refund policy).
 *
 * These pages are read, not browsed: a single measured column, hairline rules
 * between sections instead of cards, and no decorative color. The only accent
 * is the primary link color, which is also what marks the active section in
 * the contents rail.
 */
export function LegalPageLayout({
  title,
  updatedAt,
  summary,
  sections,
  children,
  eyebrow = 'Legal',
  updatedLabel = 'Last updated',
  contentsLabel = 'On this page',
  documentLang = 'en',
  languageLinks = [],
}) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const activeId = useActiveSection(sections);

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('Login'));

  return (
    <div className="min-h-screen bg-[#fcfdff] dark:bg-[#08080a] text-foreground transition-colors duration-300">
      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <main lang={documentLang} className="pt-20 sm:pt-24 pb-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <header className="border-b border-border/60 pb-8">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {updatedLabel} {updatedAt}
            </p>
            {languageLinks.length > 0 ? (
              <nav aria-label="Document language" className="mt-5 flex flex-wrap gap-2">
                {languageLinks.map(({ href, label, active, lang }) => (
                  <Link
                    key={href}
                    to={href}
                    lang={lang}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#5a63df] bg-[#5a63df]/[0.06] text-[#4a52c9] dark:text-[#a9afff]'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            ) : null}
            {summary ? (
              <p className="mt-6 max-w-[68ch] text-[15px] leading-7 text-muted-foreground">
                {summary}
              </p>
            ) : null}
          </header>

          <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
            <TableOfContents sections={sections} activeId={activeId} label={contentsLabel} />
            <div className="min-w-0 max-w-[68ch]">{children}</div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TableOfContents({ sections, activeId, label }) {
  return (
    <nav aria-label={label} className="hidden lg:block">
      <div className="sticky top-24 py-10">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <ol className="space-y-2.5 border-l border-border/60">
          {sections.map((section) => {
            const isActive = section.id === activeId;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`-ml-px block border-l pl-4 text-[13px] leading-5 transition-colors ${
                    isActive
                      ? 'border-primary text-foreground font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {section.title}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/** Highlights the section nearest the top of the viewport. */
function useActiveSection(sections) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        });

        const ordered = sections.map((s) => s.id).filter((id) => visible.has(id));
        if (ordered.length > 0) setActiveId(ordered[0]);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return activeId;
}

export function LegalSection({ id, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-b border-border/50 py-10 last:border-b-0 last:pb-0"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

/** Heading for a named clause inside a section — keeps the outline real, not just bold text. */
export function LegalSubheading({ children }) {
  return <h3 className="pt-2 font-medium text-foreground">{children}</h3>;
}

export function LegalList({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground/40">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** Term/definition pairs — used where a colored chip per item would be noise. */
export function LegalDefinitions({ items }) {
  return (
    <dl className="space-y-3">
      {items.map(({ term, description }) => (
        <div key={term} className="sm:flex sm:gap-3">
          <dt className="font-medium text-foreground sm:min-w-[190px] sm:shrink-0">{term}</dt>
          <dd className="mt-0.5 sm:mt-0">{description}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Legal notices use a neutral default; warnings can be highlighted when action matters. */
export function LegalNote({ title, children, tone = 'neutral' }) {
  const toneClasses =
    tone === 'warning'
      ? 'border-l-4 border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-400 dark:bg-rose-950/40 dark:text-rose-100'
      : 'border-l-2 border-border bg-muted/40 text-muted-foreground';

  return (
    <aside className={`rounded-r-md py-3 pl-4 pr-4 ${toneClasses}`}>
      {title ? <p className="font-semibold text-inherit">{title}</p> : null}
      <div className={title ? 'mt-1' : undefined}>{children}</div>
    </aside>
  );
}

export function LegalTable({ caption, columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th key={column} scope="col" className="py-2.5 pr-6 font-medium text-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-border/50 last:border-b-0">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={`py-2.5 pr-6 ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LegalPageLayout;
