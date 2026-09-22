import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import ChevronRight from 'lucide-react/icons/chevron-right';
import ChevronDown from 'lucide-react/icons/chevron-down';
import Sparkles from 'lucide-react/icons/sparkles';
import Mail from 'lucide-react/icons/mail';
import ShieldCheck from 'lucide-react/icons/shield-check';
import ArrowUp from 'lucide-react/icons/arrow-up';
import Layers from 'lucide-react/icons/layers';
import BookOpen from 'lucide-react/icons/book-open';
import SparklesIcon from 'lucide-react/icons/sparkles';
import Building2 from 'lucide-react/icons/building-2';
import Youtube from 'lucide-react/icons/youtube';
import Linkedin from 'lucide-react/icons/linkedin';
import Facebook from 'lucide-react/icons/facebook';
import Instagram from 'lucide-react/icons/instagram';
import { toast } from 'sonner';
import { detectLocation } from '@/lib/pricingUtils';

function XIcon({ size = 16, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const footerLinks = {
  'Core Features': {
    icon: Layers,
    links: [
      { label: 'Band Score Calculator', href: '/ielts-band-score-calculator' },
      { label: 'University Requirements', href: '/ielts-university-requirements' },
      { label: 'Writing Task Evaluator', href: '/ielts-writing-checker' },
      { label: 'Speaking Test Simulator', href: '/ielts-speaking-practice-ai' },
      { label: 'Listening Practice Hub', href: '/cambridge-ielts-practice-tests#listening' },
      { label: 'Reading Comprehension', href: '/cambridge-ielts-practice-tests#reading' },
    ],
  },
  'Test Prep': {
    icon: BookOpen,
    links: [
      { label: 'Writing Band Score Criteria', href: '/ielts-writing-checker' },
      { label: 'Speaking Criteria Breakdown', href: '/ielts-speaking-practice-ai' },
      // /vocabulary is a ProtectedRoute and is Disallow'd in robots.txt, so linking
      // it from the public footer spent an internal link on a page crawlers cannot read.
      { label: 'Reading Strategies', href: '/blog?category=Reading' },
      { label: 'Mock Test Analytics', href: '/cambridge-ielts-practice-tests' },
    ],
  },
  Resources: {
    icon: SparklesIcon,
    links: [
      { label: 'IELTS Prep Blog & Guides', href: '/blog' },
      { label: 'Cambridge Practice Material', href: '/cambridge-ielts-practice-tests' },
      { label: 'Pricing Plans & Access', href: '/#pricing' },
    ],
  },
  Company: {
    icon: Building2,
    links: [
      { label: 'About Platform', href: '/about' },
      { label: 'Contact Support', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund & Cancellation', href: '/refund' },
    ],
  },
};

const socialLinks = [
  {
    icon: Facebook,
    label: 'Facebook',
    href: 'https://www.facebook.com/ieltsaipro',
    hoverClass: 'hover:text-[#1877F2] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    href: 'https://www.instagram.com/ieltsaipro/',
    hoverClass: 'hover:text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10',
  },
  {
    icon: XIcon,
    label: 'X',
    href: 'https://x.com/IELTSAiPro',
    hoverClass: 'hover:text-white hover:border-white/40 hover:bg-white/10',
  },
  {
    icon: Youtube,
    label: 'YouTube',
    href: 'https://youtube.com',
    hoverClass: 'hover:text-[#FF0000] hover:border-[#FF0000]/40 hover:bg-[#FF0000]/10',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    hoverClass: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10',
  },
];

function isModifiedEvent(event) {
  if (!event) return false;
  return event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function scrollToPageTopImmediately(event) {
  if (isModifiedEvent(event)) {
    return;
  }

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = 'smooth';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    root.style.scrollBehavior = previousScrollBehavior;
  }, 500);
}

function FooterLink({ href, children }) {
  const className =
    'group flex items-center gap-1.5 py-1 sm:py-0 text-sm font-medium text-slate-400 transition-all duration-200 hover:text-white hover:translate-x-1 active:text-indigo-300';

  if (href.startsWith('/#')) {
    return (
      <a href={href} className={className}>
        <ChevronRight className="w-3 h-3 text-indigo-400/0 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all duration-200 -ml-4 group-hover:ml-0" />
        <span>{children}</span>
      </a>
    );
  }

  return (
    <Link to={href} className={className} onClick={scrollToPageTopImmediately} viewTransition>
      <ChevronRight className="w-3 h-3 text-indigo-400/0 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all duration-200 -ml-4 group-hover:ml-0" />
      <span>{children}</span>
    </Link>
  );
}

function FooterBrandSection({ handleCopyEmail }) {
  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left space-y-4">
      {/* Logo & AI Badge Header */}
      <div className="flex items-center justify-center sm:justify-start gap-2.5">
        <Link to="/" className="block w-fit" viewTransition>
          <Logo size="lg" variant="footer" />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
          AI Powered
        </span>
      </div>

      {/* Description */}
      <p className="max-w-md text-xs sm:text-sm leading-relaxed text-slate-400 font-medium">
        Web-based IELTS practice platform for Reading, Listening, Writing, and Speaking with instant
        criterion-based AI practice feedback, score analytics, and target-band guidance.
      </p>

      {/* Email & Social Links */}
      <div className="pt-1 flex flex-col items-center sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
        <button
          onClick={handleCopyEmail}
          className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/4 hover:bg-white/8 active:bg-white/12 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all duration-200 hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/10 w-fit"
          title="Click to copy email address"
        >
          <Mail className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>mail@ieltsai.pro</span>
        </button>

        <div className="flex items-center justify-center gap-2">
          {socialLinks.map((social, i) => (
            <a
              key={i}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`h-9 w-9 rounded-xl bg-white/4 border border-white/15 flex items-center justify-center text-slate-300 transition-all duration-300 active:scale-95 ${social.hoverClass}`}
              aria-label={`Follow us on ${social.label}`}
            >
              <social.icon size={16} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function getFooterLegalLinks(isBangladesh) {
  if (!isBangladesh) return footerLinks;

  const legalDocuments = ['privacy', 'terms', 'refund-cancellation'];
  const legalLabels = ['Privacy Notice', 'Terms & Conditions', 'Refund & Cancellation'];
  const regionalCompanyLinks = [
    { label: 'About Platform', href: '/about' },
    { label: 'Contact Support', href: '/contact' },
    ...legalDocuments.map((document, index) => ({
      label: legalLabels[index],
      href: `/bd/${document}`,
    })),
  ];

  return {
    ...footerLinks,
    Company: { ...footerLinks.Company, links: regionalCompanyLinks },
  };
}

function FooterNavigationGrid({ links, isBangladesh }) {
  const [openCategories, setOpenCategories] = React.useState({
    'Core Features': true,
  });

  React.useEffect(() => {
    if (isBangladesh) {
      setOpenCategories((previous) => ({ ...previous, Company: true }));
    }
  }, [isBangladesh]);

  const toggleCategory = (title) => {
    setOpenCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-3 sm:gap-x-6 sm:gap-y-8">
      {Object.entries(links).map(([title, category]) => {
        const Icon = category.icon;
        const isOpen = !!openCategories[title];

        return (
          <div
            key={title}
            className="rounded-xl border border-white/5 bg-white/1.5 p-3.5 sm:border-0 sm:bg-transparent sm:p-0 space-y-3 sm:space-y-4 transition-colors"
          >
            <button
              type="button"
              onClick={() => toggleCategory(title)}
              className="w-full flex items-center justify-between text-left sm:cursor-default"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 sm:h-auto sm:w-auto sm:bg-transparent sm:border-0 sm:p-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-200 sm:text-slate-300">
                  {title}
                </p>
              </div>

              <span className="sm:hidden text-slate-400 p-1">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </span>
            </button>

            <ul
              className={`space-y-2.5 pt-1 sm:pt-0 sm:block ${
                isOpen ? 'block' : 'hidden sm:block'
              }`}
            >
              {category.links.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function FooterBottomBar({ currentYear, isBangladesh }) {
  const legalLinks = isBangladesh
    ? [
        { label: 'Privacy Notice', href: '/bd/privacy' },
        { label: 'Terms & Conditions', href: '/bd/terms' },
        { label: 'Refund & Cancellation', href: '/bd/refund-cancellation' },
      ]
    : [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Refund & Cancellation', href: '/refund' },
      ];

  return (
    <div className="flex flex-col gap-5 pt-8 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 font-medium text-center sm:text-left">
        <span className="text-slate-400">© {currentYear} IELTS Ai Pro</span>
        <span className="hidden sm:inline text-slate-700">•</span>
        {legalLinks.map((link) => (
          <React.Fragment key={link.href}>
            <Link
              to={link.href}
              className="hover:text-white transition-colors py-1 px-1.5 sm:p-0"
              onClick={scrollToPageTopImmediately}
              viewTransition
            >
              {link.label}
            </Link>
            <span className="text-slate-700">•</span>
          </React.Fragment>
        ))}
        <Link
          to="/about"
          className="hover:text-white transition-colors py-1 px-1.5 sm:p-0"
          onClick={scrollToPageTopImmediately}
          viewTransition
        >
          About Platform
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3.5 sm:gap-4">
        <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/3 px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 backdrop-blur-md text-center max-w-md sm:max-w-none">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <span>
            Independent prep platform. Not affiliated with IELTS, IDP, or British Council.
          </span>
        </div>

        <button
          onClick={() => scrollToPageTopImmediately()}
          className="h-9 w-9 rounded-xl bg-white/4 border border-white/15 hover:border-indigo-400/50 hover:bg-indigo-500/20 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm shrink-0"
          title="Back to top"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const [detectedCountry, setDetectedCountry] = React.useState('');
  const isRegionalLegalRoute =
    location.pathname.startsWith('/bd/') || location.pathname.startsWith('/bn/');
  const isBangladesh = isRegionalLegalRoute || detectedCountry === 'BD';
  const regionalLinks = getFooterLegalLinks(isBangladesh);

  React.useEffect(() => {
    let cancelled = false;
    detectLocation()
      .then((country) => {
        if (!cancelled) setDetectedCountry(country || '');
      })
      .catch(() => {
        if (!cancelled) setDetectedCountry('');
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('mail@ieltsai.pro');
    toast.success('Email address copied to clipboard!');
  };

  return (
    <footer className="dark relative overflow-hidden border-t border-white/10 bg-[#050711] text-slate-300 pb-10 pt-14 transition-colors duration-300">
      {/* Top ambient glowing divider bar */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-linear-to-r/srgb from-transparent via-indigo-500/60 to-transparent" />

      {/* Decorative background lighting blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-128 w-128 rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 h-128 w-128 rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1fr_2fr] items-start">
          <FooterBrandSection handleCopyEmail={handleCopyEmail} />
          <FooterNavigationGrid links={regionalLinks} isBangladesh={isBangladesh} />
        </div>
        <FooterBottomBar currentYear={currentYear} isBangladesh={isBangladesh} />
      </div>
    </footer>
  );
}
