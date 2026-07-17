import React from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import Twitter from 'lucide-react/icons/twitter';
import Github from 'lucide-react/icons/github';
import Linkedin from 'lucide-react/icons/linkedin';
import Instagram from 'lucide-react/icons/instagram';
import Heart from 'lucide-react/icons/heart';
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

  return (
    <footer
      className="relative pt-12 pb-6 overflow-hidden bg-[#030303] border-t border-white/[0.05] dark"
      data-oid="435qs5q"
    >
      {/* Top Gradient Border */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        data-oid="y:x.eqd"
      />

      {/* Professional Background Elements */}
      <div
        className="absolute top-[-25%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none opacity-60"
        data-oid="tays38:"
      />

      <div
        className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none opacity-50"
        data-oid=".-2ph:p"
      />

      <div className="mx-auto max-w-7xl px-6 relative z-10" data-oid="9x9doqq">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 mb-4" data-oid="2zvry:5">
          {/* Brand Column */}
          <div className="lg:col-span-5" data-oid="2lm30kq">
            <Link
              to="/"
              className="mb-5 group block w-fit"
              aria-label="IELTS Ai Pro - Home"
              data-oid="-4f62t5"
            >
              <Logo size="lg" />
            </Link>
            <p
              className="max-w-sm text-base font-medium leading-relaxed text-muted-foreground mb-6"
              data-oid="yvixqel"
            >
              Master the IELTS with AI-powered personalized coaching. Get instant evaluation on
              Writing & Speaking to achieve your target band score faster.
            </p>
            <div className="flex flex-col gap-2 mb-2" data-oid="3sw_6sw">
              <div className="flex items-center gap-3" data-oid="od_021f">
                {[
                  { icon: Twitter, label: 'Twitter' },
                  { icon: Github, label: 'GitHub' },
                  { icon: Linkedin, label: 'LinkedIn' },
                  { icon: Instagram, label: 'Instagram' },
                ].map((social, i) => (
                  <m.a
                    key={i}
                    href="#"
                    whileHover={{ y: -4, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-9 w-9 rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all duration-300"
                    aria-label={`Follow us on ${social.label}`}
                    data-oid="wrvgtwi"
                  >
                    <social.icon size={16} data-oid=":_ynf6e" />
                  </m.a>
                ))}
              </div>
              <a
                href="mailto:mail@ieltsai.pro"
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 group w-fit px-3 py-2 rounded-xl bg-muted/20 border border-border/10 hover:border-primary/30 hover:bg-primary/5"
                data-oid="18yn2wa"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" data-oid="dlq3mmq" />
                <span data-oid="ttp:f1r">mail@ieltsai.pro</span>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"
            data-oid="7oskr:y"
          >
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} data-oid="z6ozpba">
                <h2
                  className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50 mb-6"
                  data-oid="sgwsvej"
                >
                  {title}
                </h2>
                <ul className="space-y-2.5" data-oid=":-ex5e7">
                  {links.map((link) => (
                    <li key={link.label} data-oid="vhzidcf">
                      {link.href.startsWith('/') && !link.reload ? (
                        <Link
                          to={link.href}
                          className="group inline-flex items-center text-[15px] font-medium text-muted-foreground hover:text-white transition-all duration-300 hover:translate-x-1"
                          data-oid="1cb-lc5"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="group inline-flex items-center text-[15px] font-medium text-muted-foreground hover:text-white transition-all duration-300 hover:translate-x-1"
                          data-oid=".hwds3a"
                        >
                          {link.label}
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
        <div
          className="pt-3 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-4"
          data-oid="g-le7_1"
        >
          <div
            className="flex items-center gap-2 text-[13px] font-medium text-foreground/80"
            data-oid="asg7g.t"
          >
            <span data-oid="2icld5w">© {currentYear} IELTS AI Pro. All rights reserved.</span>
          </div>

          <div
            className="flex items-center gap-1.5 text-[12px] font-bold text-foreground/80 italic"
            data-oid="lw54ffm"
          >
            <span data-oid="i10r.fh">Designed with</span>
            <Heart
              size={12}
              className="text-rose-500 fill-rose-500 animate-pulse"
              data-oid="0sc449_"
            />

            <span data-oid="v_9r3v:">for IELTS Dreamers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
