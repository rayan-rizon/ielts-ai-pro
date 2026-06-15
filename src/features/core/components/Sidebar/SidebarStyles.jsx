import React from 'react';

export const SidebarStyles = ({ children }) => (
  <div
    style={{
      '--sidebar-bg-light': '0 0% 100%',
      '--sidebar-fg-light': '222.2 84% 4.9%',
      '--sidebar-accent-light': '210 40% 96%',
      '--sidebar-border-light': '214.3 31.8% 91.4%',
      '--sidebar-bg-dark': '224 71% 4%',
      '--sidebar-fg-dark': '213 31% 91%',
      '--sidebar-accent-dark': '222 47% 11%',
      '--sidebar-border-dark': '217 33% 18%',
    }}
    data-oid="ly09-h0"
  >
    <style data-oid="in0lyzk">
      {`
        .sidebar-style {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: hsl(var(--sidebar-fg-light));
          border-right: 1px solid rgba(0,0,0,0.05);
          /* Hardware acceleration & Transition hints */
          transform: translateZ(0);
          will-change: width, transform, backdrop-filter;
          backface-visibility: hidden;
          perspective: 1000;
        }
        .sidebar-style [data-sidebar="sidebar"] {
          background: transparent !important;
        }
        .sidebar-accent-style {
          background: hsl(var(--sidebar-accent-light));
        }
        .dark .sidebar-style {
          background: linear-gradient(to bottom, rgba(14, 16, 27, 0.96), rgba(8, 9, 15, 0.98)) !important;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          color: hsl(var(--sidebar-fg-dark));
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dark .sidebar-accent-style {
          background: hsl(var(--sidebar-accent-dark));
        }
        .card-elevated {
          background: hsl(0 0% 98%);
        }
        .dark .card-elevated {
          background: hsl(222 47% 11%);
        }
        .surface-1 {
          background: hsl(0 0% 97%);
        }
        .dark .surface-1 {
          background: hsl(222 47% 9%);
        }
        .text-brand-primary {
          background: linear-gradient(135deg, hsl(221, 83%, 53%), hsl(254, 62%, 57%));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .dark .text-brand-primary {
          background: linear-gradient(135deg, hsl(226, 100%, 70%), hsl(254, 62%, 75%));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .active-glow {
          box-shadow: 0 0 20px -5px hsl(var(--primary) / 0.5);
        }
        .active-glow-orange {
          box-shadow: 0 0 20px -5px rgba(249, 115, 22, 0.4);
        }
        .active-glow-purple {
          box-shadow: 0 0 20px -5px rgba(168, 85, 247, 0.4);
        }
        .active-glow-red {
          box-shadow: 0 0 20px -5px rgba(239, 68, 68, 0.4);
        }
      `}
    </style>
    {children}
  </div>
);
