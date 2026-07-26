import React from 'react';

const skills = [
  { short: 'R', label: 'Reading', className: 'bg-blue-100 text-blue-800' },
  { short: 'L', label: 'Listening', className: 'bg-emerald-100 text-emerald-800' },
  { short: 'W', label: 'Writing', className: 'bg-violet-100 text-violet-800' },
  { short: 'S', label: 'Speaking', className: 'bg-amber-100 text-amber-900' },
];

const learnerAvatars = [33, 47, 12, 32, 5];

export default function SkillBadgeStack({ size = 'md', className = '', variant = 'skills' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-xs';

  if (variant === 'avatars') {
    return (
      <span className={`flex shrink-0 -space-x-2 ${className}`} aria-label="IELTS Learners">
        {learnerAvatars.map((avatar) => (
          <img
            key={avatar}
            src={`/hero-learners/avatar-${avatar}.webp`}
            alt="Learner"
            width="40"
            height="40"
            className={`rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm dark:border-slate-900 ${sizeClass}`}
            loading="lazy"
            decoding="async"
          />
        ))}
      </span>
    );
  }

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
