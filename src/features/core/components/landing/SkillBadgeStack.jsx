import React from 'react';

const skills = [
  { short: 'R', label: 'Reading', className: 'bg-blue-100 text-blue-800' },
  { short: 'L', label: 'Listening', className: 'bg-emerald-100 text-emerald-800' },
  { short: 'W', label: 'Writing', className: 'bg-violet-100 text-violet-800' },
  { short: 'S', label: 'Speaking', className: 'bg-amber-100 text-amber-900' },
];

export default function SkillBadgeStack({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-xs';

  return (
    <span
      className={`flex shrink-0 -space-x-2 ${className}`}
      aria-label="Reading, Listening, Writing, and Speaking"
    >
      {skills.map((skill) => (
        <span
          key={skill.short}
          title={skill.label}
          className={`flex items-center justify-center rounded-full border-2 border-white font-black shadow-sm dark:border-slate-900 ${sizeClass} ${skill.className}`}
        >
          {skill.short}
        </span>
      ))}
    </span>
  );
}
