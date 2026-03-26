import React from 'react';
import { m } from 'framer-motion';

const brands = [
  { name: 'Cambridge', style: 'font-serif' },
  { name: 'OXFORD', style: 'tracking-tighter' },
  { name: 'Harvard', style: 'font-display' },
  { name: 'UofT', style: 'italic font-mono' },
  { name: 'MIT', style: 'font-mono tracking-tight' },
  { name: 'Melbourne', style: 'font-sans' },
];

export default function SocialProofSection() {
  return (
    <section
      className="border-y border-border/40 bg-muted/30 dark:bg-muted/10 py-4 md:py-8 overflow-hidden"
      data-oid="pkgo3hi"
    >
      <div className="max-w-7xl mx-auto px-6" data-oid="nk-34fg">
        <m.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[10px] sm:text-xs text-foreground/80 font-bold mb-6 uppercase tracking-[0.2em] text-center"
          data-oid="xriy-66"
        >
          Leading institutions trust our graduates
        </m.p>
        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto"
          data-oid="o7az0kv"
        >
          <div
            className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] md:[mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
            data-oid="20g-mmd"
          >
            <div className="flex animate-scroll-x gap-16 md:gap-24 items-center" data-oid="4w.j8xo">
              {/* First set of brands */}
              {brands.map((brand, i) => (
                <span
                  key={`first-${brand.name}`}
                  className={`text-xl md:text-2xl font-bold text-foreground/40 dark:text-foreground/30 ${brand.style} flex-shrink-0 whitespace-nowrap transition-all duration-300 hover:text-foreground hover:opacity-100 cursor-default`}
                  data-oid="s-ujb4g"
                >
                  {brand.name}
                </span>
              ))}
              {/* Duplicate set for seamless loop */}
              {brands.map((brand, i) => (
                <span
                  key={`second-${brand.name}`}
                  className={`text-xl md:text-2xl font-bold text-foreground/40 dark:text-foreground/30 ${brand.style} flex-shrink-0 whitespace-nowrap transition-all duration-300 hover:text-foreground hover:opacity-100 cursor-default`}
                  data-oid="xd7yaj4"
                >
                  {brand.name}
                </span>
              ))}
            </div>
          </div>
        </m.div>
      </div>

      <style data-oid="82.ms-s">{`
        @keyframes scroll-x {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-x {
          animation: scroll-x 30s linear infinite;
        }

        .animate-scroll-x:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
