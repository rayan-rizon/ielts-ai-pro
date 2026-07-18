import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, Twitter, Github, Linkedin, Instagram } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const footerLinks = {
  Platform: [
    { label: 'Platform features', href: '/#features' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Frequently asked questions', href: '/#faq' },
  ],
  Practice: [
    { label: 'Free IELTS practice tests', href: '/free-ielts-practice-tests' },
    { label: 'IELTS Writing checker', href: '/ielts-writing-checker' },
    { label: 'IELTS Speaking practice', href: '/ielts-speaking-practice-ai' },
    { label: 'IELTS mock tests online', href: '/ielts-mock-test-online' },
  ],
  Resources: [
    { label: 'Cambridge IELTS practice', href: '/cambridge-ielts-practice-tests' },
    { label: 'IELTS band score feedback', href: '/ielts-band-score-feedback' },
    { label: 'AI IELTS preparation', href: '/ai-ielts-preparation' },
    { label: 'Contact support', href: '/contact' },
  ],
};

const socialLinks = [
  {
    icon: Twitter,
    label: 'Twitter',
    href: '#',
    hoverClass: 'hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/10',
  },
  {
    icon: Github,
    label: 'GitHub',
    href: '#',
    hoverClass: 'hover:text-white hover:border-white/30 hover:bg-white/10',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: '#',
    hoverClass: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/30 hover:bg-[#0A66C2]/10',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    href: '#',
    hoverClass: 'hover:text-[#E1306C] hover:border-[#E1306C]/30 hover:bg-[#E1306C]/10',
  },
];

function FooterLink({ href, children }) {
  const className =
    'group relative w-fit text-sm font-medium text-slate-400 transition-colors hover:text-white';

  if (href.startsWith('/#')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dark relative overflow-hidden border-t border-white/[0.05] bg-[#050711] pb-10 pt-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="pointer-events-none absolute -top-44 left-1/3 h-96 w-96 rounded-full bg-primary/10 blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid gap-12 border-b border-white/[0.07] pb-12 lg:grid-cols-[1.05fr_1.4fr]">
          <div>
            <Link to="/" className="block w-fit" aria-label="IELTS Ai Pro home">
              <Logo size="lg" className="text-white" />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
              A web-based IELTS practice platform for Reading, Listening, Writing, and Speaking,
              with AI-assisted feedback, progress analytics, vocabulary review, and an adaptive
              learning path on eligible plans.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href="mailto:mail@ieltsai.pro"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-primary/40 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 text-primary" /> mail@ieltsai.pro
              </a>

              <div className="flex items-center gap-2">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className={`h-9 w-9 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-slate-400 transition-all duration-300 ${social.hoverClass}`}
                    aria-label={`Follow us on ${social.label}`}
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="mb-4 text-[11px] font-black uppercase tracking-[.18em] text-slate-500">
                  {title}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.href}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-7 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {currentYear} IELTS Ai Pro</span>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/about" className="hover:text-white">
              About
            </Link>
          </div>
          <span className="flex max-w-xl items-start gap-2 leading-5 md:text-right">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Independent preparation platform. Not affiliated with IELTS, IDP, the British Council,
            or Cambridge University Press &amp; Assessment.
          </span>
        </div>
      </div>
    </footer>
  );
}
