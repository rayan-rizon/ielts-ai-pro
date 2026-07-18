import React from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Instagram, Heart, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Practice: [
      { label: 'Writing Master', href: '#showcase' },
      { label: 'Speaking Lab', href: '#showcase' },
      { label: 'Mock Exams', href: '#modules' },
      { label: 'Vocabulary', href: '#features' },
    ],

    Resources: [
      { label: 'IELTS Writing Checker', href: '/ielts-writing-checker', reload: true },
      { label: 'IELTS Speaking Practice', href: '/ielts-speaking-practice-ai', reload: true },
      { label: 'IELTS Mock Test Online', href: '/ielts-mock-test-online', reload: true },
      { label: 'Cambridge IELTS Tests', href: '/cambridge-ielts-practice-tests', reload: true },
      { label: 'Free IELTS Practice', href: '/free-ielts-practice-tests', reload: true },
      { label: 'FAQ', href: '#faq' },
    ],

    Company: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  };

  const socialLinks = [
    {
      icon: Twitter,
      label: 'Twitter',
      href: '#',
      hoverClass:
        'hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/10 hover:shadow-[0_0_15px_rgba(29,161,242,0.15)]',
    },
    {
      icon: Github,
      label: 'GitHub',
      href: '#',
      hoverClass:
        'hover:text-white hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      href: '#',
      hoverClass:
        'hover:text-[#0A66C2] hover:border-[#0A66C2]/30 hover:bg-[#0A66C2]/10 hover:shadow-[0_0_15px_rgba(10,102,194,0.15)]',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      href: '#',
      hoverClass:
        'hover:text-[#E1306C] hover:border-[#E1306C]/30 hover:bg-[#E1306C]/10 hover:shadow-[0_0_15px_rgba(225,48,108,0.15)]',
    },
  ];

  return (
    <footer className="relative pt-16 pb-12 overflow-hidden bg-[#030303] border-t border-white/[0.05] dark">
      {/* Top Gradient Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-indigo-500/30 to-transparent" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Soft Glow Ambient Lighting */}
      <div className="absolute -top-40 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none opacity-40" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div>
              <Link to="/" className="mb-3 group block w-fit" aria-label="IELTS Ai Pro - Home">
                <Logo className="text-white" />
              </Link>
              <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground mb-4">
                Master the IELTS with AI-powered personalized coaching. Get instant evaluation on
                Writing & Speaking to achieve your target band score faster.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Social links */}
              <div className="flex items-center gap-2">
                {socialLinks.map((social, i) => (
                  <m.a
                    key={i}
                    href={social.href}
                    whileHover={{ y: -3, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-9 w-9 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-muted-foreground transition-all duration-300 ${social.hoverClass}`}
                    aria-label={`Follow us on ${social.label}`}
                  >
                    <social.icon size={16} />
                  </m.a>
                ))}
              </div>

              {/* Email link */}
              <a
                href="mailto:mail@ieltsai.pro"
                className="text-xs font-bold text-muted-foreground hover:text-white transition-all duration-300 flex items-center gap-2.5 group w-fit px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>mail@ieltsai.pro</span>
              </a>
            </div>
          </div>

          {/* Links Columns (Sitemaps) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
                  {title}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') && !link.reload ? (
                        <Link
                          to={link.href}
                          className="group relative flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-all duration-300 w-fit"
                        >
                          <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                            {link.label}
                          </span>
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="group relative flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-all duration-300 w-fit"
                        >
                          <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                            {link.label}
                          </span>
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 text-xs font-medium text-muted-foreground">
            <span>© {currentYear} IELTS AI Pro. All rights reserved.</span>
            <div className="hidden md:block h-3 w-px bg-white/10" />
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
              <div className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-primary/70" />
                <span>Secured by Stripe</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground/75 italic">
            <span>Designed with</span>
            <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse" />
            <span>for IELTS Dreamers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
