import React from 'react';

const learnerAvatars = [33, 47, 12, 32, 5];

export default function SkillBadgeStack({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  return (
    <span className={`flex shrink-0 -space-x-2 ${className}`} aria-label="IELTS Learners">
      {learnerAvatars.map((avatar) => (
        <img
          key={avatar}
          src={`/hero-learners/avatar-${avatar}.webp`}
          alt="Learner"
          width="36"
          height="36"
          className={`rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm dark:border-slate-900 ${sizeClass}`}
          loading="lazy"
          decoding="async"
        />
      ))}
    </span>
  );
}
