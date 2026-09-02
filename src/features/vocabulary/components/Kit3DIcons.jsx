import React, { memo, useId } from 'react';

// ─── Performance-Optimized 3D Vector SVG Icons ───

// 1. Speaking: Giving & developing opinions (Luminous Microphone)
export const SpeakingMic3DIcon = memo(() => {
  const uid = useId();
  const micGrad = `spkMicGrad-${uid}`;
  const ringGrad = `spkRingGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={micGrad} x1="18" y1="10" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient
          id={ringGrad}
          x1="14"
          y1="20"
          x2="50"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Ground Shadow */}
      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#047857" opacity="0.25" />

      {/* Sound Waves Outer Aura */}
      <path
        d="M12 28C10 30 10 34 12 36"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M52 28C54 30 54 34 52 36"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M8 24C5 28 5 36 8 40"
        stroke="#6ee7b7"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M56 24C59 28 59 36 56 40"
        stroke="#6ee7b7"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Mic Mesh Capsule */}
      <rect x="22" y="10" width="20" height="26" rx="10" fill={`url(#${micGrad})`} />
      <rect x="24" y="12" width="16" height="12" rx="8" fill="#ffffff" opacity="0.25" />
      <line x1="22" y1="22" x2="42" y2="22" stroke="#047857" strokeWidth="1.5" opacity="0.4" />

      {/* Metallic U-Shaped Stand */}
      <path
        d="M16 28C16 37 23 44 32 44C41 44 48 37 48 28"
        stroke={`url(#${ringGrad})`}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Stem & Base */}
      <rect x="30" y="44" width="4" height="7" rx="1" fill="#047857" />
      <rect x="22" y="50" width="20" height="3" rx="1.5" fill="#10b981" />

      {/* Gloss Highlight */}
      <circle cx="27" cy="16" r="2.5" fill="#ffffff" opacity="0.7" />
    </svg>
  );
});
SpeakingMic3DIcon.displayName = 'SpeakingMic3DIcon';

// 2. Speaking: Agreeing, disagreeing & balancing (Dual Discussion Bubbles)
export const SpeakingDialogue3DIcon = memo(() => {
  const uid = useId();
  const mainGrad = `spkMainGrad-${uid}`;
  const secGrad = `spkSecGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={mainGrad}
          x1="10"
          y1="14"
          x2="46"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={secGrad} x1="24" y1="20" x2="54" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#047857" opacity="0.2" />

      {/* Back Right Bubble */}
      <rect x="24" y="14" width="30" height="24" rx="12" fill={`url(#${secGrad})`} opacity="0.9" />
      <path d="M46 38L50 45L40 38H46Z" fill={`url(#${secGrad})`} opacity="0.9" />

      {/* Front Left Main Bubble */}
      <rect x="10" y="22" width="34" height="26" rx="13" fill={`url(#${mainGrad})`} />
      <path d="M18 48L14 55L24 48H18Z" fill={`url(#${mainGrad})`} />

      {/* Balance Scales dots */}
      <circle cx="21" cy="35" r="2.5" fill="#ffffff" />
      <circle cx="27" cy="35" r="2.5" fill="#ffffff" />
      <circle cx="33" cy="35" r="2.5" fill="#ffffff" />

      {/* Gloss */}
      <circle cx="17" cy="28" r="2" fill="#ffffff" opacity="0.6" />
    </svg>
  );
});
SpeakingDialogue3DIcon.displayName = 'SpeakingDialogue3DIcon';

// 3. Speaking: Fluency, explanation & examples (Luminous Megaphone)
export const SpeakingMegaphone3DIcon = memo(() => {
  const uid = useId();
  const megaGrad = `spkMegaGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={megaGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="60%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#047857" opacity="0.25" />

      {/* Sound Waves */}
      <path d="M44 22C47 25 47 31 44 34" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M49 18C54 23 54 33 49 38"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M54 14C60 21 60 35 54 42"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Megaphone Cone Body */}
      <path d="M18 24L38 16V40L18 32V24Z" fill={`url(#${megaGrad})`} />
      <ellipse cx="38" cy="28" rx="4" ry="12" fill="#6ee7b7" />

      {/* Rear Cap & Handle */}
      <rect x="12" y="24" width="6" height="8" rx="2" fill="#047857" />
      <path d="M22 32L20 46H26L28 32H22Z" fill="#10b981" />

      {/* Gloss */}
      <path
        d="M20 25L36 18"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
});
SpeakingMegaphone3DIcon.displayName = 'SpeakingMegaphone3DIcon';

// 4. Speaking: Describing people, experiences & change (Voice Avatar)
export const SpeakingAvatar3DIcon = memo(() => {
  const uid = useId();
  const avtGrad = `spkAvtGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={avtGrad} x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#047857" opacity="0.2" />

      {/* Soundwave Aura Ring behind Avatar */}
      <circle
        cx="32"
        cy="30"
        r="22"
        stroke="#a7f3d0"
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity="0.7"
      />

      {/* Avatar Head & Body */}
      <circle cx="32" cy="20" r="8" fill={`url(#${avtGrad})`} />
      <path d="M16 48C16 38 23 32 32 32C41 32 48 38 48 48H16Z" fill={`url(#${avtGrad})`} />

      {/* Speech Wave Badge on Right */}
      <circle cx="44" cy="20" r="7" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      <path
        d="M41 20H47M43 17H45M42 23H46"
        stroke="#047857"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Gloss */}
      <circle cx="29" cy="17" r="2.5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
});
SpeakingAvatar3DIcon.displayName = 'SpeakingAvatar3DIcon';

// 5. Reading: Argument & evidence (Luminous Open Book)
export const ReadingBook3DIcon = memo(() => {
  const uid = useId();
  const bookGrad = `rdBookGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={bookGrad}
          x1="10"
          y1="14"
          x2="54"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="32" cy="54" rx="22" ry="4" fill="#0369a1" opacity="0.2" />

      {/* Book Cover Base */}
      <path d="M8 18C8 16 10 14 12 14H32V46H12C9 46 8 48 8 48V18Z" fill="#0369a1" />
      <path d="M56 18C56 16 54 14 52 14H32V46H52C55 46 56 48 56 48V18Z" fill="#0284c7" />

      {/* Left Luminous Page */}
      <path d="M12 16C20 18 28 17 32 19V47C28 45 20 46 12 44V16Z" fill="#ffffff" />
      {/* Right Luminous Page */}
      <path d="M52 16C44 18 36 17 32 19V47C36 45 44 46 52 44V16Z" fill="#f0f9ff" />

      {/* Text Line Accents */}
      <line
        x1="16"
        y1="23"
        x2="28"
        y2="24"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="29"
        x2="26"
        y2="30"
        stroke="#0284c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="16"
        y1="35"
        x2="28"
        y2="36"
        stroke="#0284c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      <line
        x1="36"
        y1="24"
        x2="48"
        y2="23"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="30"
        x2="48"
        y2="29"
        stroke="#0284c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="36"
        y1="36"
        x2="48"
        y2="35"
        stroke="#0284c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Ribbon Bookmark */}
      <path d="M32 19V38L35 35L38 38V19H32Z" fill="#f59e0b" />
    </svg>
  );
});
ReadingBook3DIcon.displayName = 'ReadingBook3DIcon';

// 6. Reading: Cause, effect & relationships (Magnifying Glass over Book)
export const ReadingGlass3DIcon = memo(() => {
  const uid = useId();
  const glassGrad = `rdGlassGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={glassGrad}
          x1="20"
          y1="12"
          x2="52"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#0369a1" opacity="0.2" />

      {/* Book Sheet in Background */}
      <rect
        x="10"
        y="14"
        width="34"
        height="38"
        rx="4"
        fill="#f0f9ff"
        stroke="#bae6fd"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="22"
        x2="34"
        y2="22"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="28"
        x2="30"
        y2="28"
        stroke="#0284c7"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1="16"
        y1="34"
        x2="28"
        y2="34"
        stroke="#0284c7"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* 3D Magnifying Glass */}
      <circle
        cx="38"
        cy="32"
        r="13"
        fill="#ffffff"
        opacity="0.9"
        stroke={`url(#${glassGrad})`}
        strokeWidth="4"
      />
      <path
        d="M47 41L56 50"
        stroke={`url(#${glassGrad})`}
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Connection arrow inside lens */}
      <path
        d="M32 32H44M40 28L44 32L40 36"
        stroke="#0284c7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="27" r="2.5" fill="#ffffff" />
    </svg>
  );
});
ReadingGlass3DIcon.displayName = 'ReadingGlass3DIcon';

// 7. Reading: Change, quantity & comparison (Book + Chart Bars)
export const ReadingChart3DIcon = memo(() => {
  const uid = useId();
  const chartGrad = `rdChartGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={chartGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#0369a1" opacity="0.2" />

      {/* Open Book Base */}
      <rect
        x="10"
        y="32"
        width="44"
        height="20"
        rx="3"
        fill="#e0f2fe"
        stroke="#38bdf8"
        strokeWidth="1.5"
      />
      <line x1="32" y1="32" x2="32" y2="52" stroke="#0284c7" strokeWidth="2" />

      {/* Ascending Comparison Chart Bars rising from book */}
      <rect x="16" y="24" width="8" height="14" rx="2" fill="#7dd3fc" />
      <rect x="28" y="16" width="8" height="22" rx="2" fill={`url(#${chartGrad})`} />
      <rect x="40" y="10" width="8" height="28" rx="2" fill="#0284c7" />

      {/* Rising Trend Line */}
      <path d="M14 26L26 18L38 11L50 8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="8" r="2.5" fill="#fbbf24" />
    </svg>
  );
});
ReadingChart3DIcon.displayName = 'ReadingChart3DIcon';

// 8. Reading: Author attitude & evaluation (Book + Star Badge)
export const ReadingStar3DIcon = memo(() => {
  const uid = useId();
  const starGrad = `rdStarGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={starGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#0369a1" opacity="0.2" />

      {/* Book Sheet */}
      <rect
        x="12"
        y="14"
        width="40"
        height="38"
        rx="5"
        fill="#f0f9ff"
        stroke="#7dd3fc"
        strokeWidth="1.5"
      />
      <line
        x1="18"
        y1="22"
        x2="38"
        y2="22"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="28"
        x2="32"
        y2="28"
        stroke="#0284c7"
        strokeWidth="2"
        opacity="0.6"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="34"
        x2="36"
        y2="34"
        stroke="#0284c7"
        strokeWidth="2"
        opacity="0.6"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="40"
        x2="28"
        y2="40"
        stroke="#0284c7"
        strokeWidth="2"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* Gold Star Evaluation Emblem */}
      <circle cx="42" cy="38" r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
      <path
        d="M42 31L44.2 35.5L49.2 36.2L45.6 39.7L46.4 44.7L42 42.4L37.6 44.7L38.4 39.7L34.8 36.2L39.8 35.5L42 31Z"
        fill="#ffffff"
      />
    </svg>
  );
});
ReadingStar3DIcon.displayName = 'ReadingStar3DIcon';

// 9. Writing: Introducing & framing an argument (3D Fountain Pen & Parchment)
export const WritingPen3DIcon = memo(() => {
  const uid = useId();
  const penGrad = `wrtPenGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={penGrad} x1="14" y1="10" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#4c1d95" opacity="0.2" />

      {/* Parchment Sheet */}
      <rect
        x="10"
        y="14"
        width="34"
        height="38"
        rx="4"
        fill="#f5f3ff"
        stroke="#ddd6fe"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="22"
        x2="34"
        y2="22"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="28"
        x2="30"
        y2="28"
        stroke="#7c3aed"
        strokeWidth="2"
        opacity="0.6"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="34"
        x2="32"
        y2="34"
        stroke="#7c3aed"
        strokeWidth="2"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* Fountain Pen (Angled) */}
      <g transform="rotate(-30 40 30)">
        <rect x="37" y="6" width="6" height="32" rx="3" fill={`url(#${penGrad})`} />
        {/* Metallic Band */}
        <rect x="36.5" y="28" width="7" height="4" fill="#fbbf24" />
        {/* Pen Nib */}
        <path d="M37 32L40 42L43 32H37Z" fill="#f59e0b" />
        <line x1="40" y1="32" x2="40" y2="38" stroke="#78350f" strokeWidth="1" />
      </g>
    </svg>
  );
});
WritingPen3DIcon.displayName = 'WritingPen3DIcon';

// 10. Writing: Analysis, cause & consequence (Document + Cause Tree)
export const WritingNodes3DIcon = memo(() => {
  const uid = useId();
  const nodeGrad = `wrtNodeGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={nodeGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#4c1d95" opacity="0.2" />

      {/* Document Base */}
      <rect
        x="12"
        y="12"
        width="40"
        height="40"
        rx="5"
        fill="#faf5ff"
        stroke="#e9d5ff"
        strokeWidth="1.5"
      />

      {/* Flowchart Nodes for Analysis */}
      <rect x="26" y="18" width="12" height="8" rx="2" fill={`url(#${nodeGrad})`} />
      <path
        d="M32 26V32M32 32H20V38M32 32H44V38"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="14" y="38" width="12" height="8" rx="2" fill="#c084fc" />
      <rect x="38" y="38" width="12" height="8" rx="2" fill="#c084fc" />
    </svg>
  );
});
WritingNodes3DIcon.displayName = 'WritingNodes3DIcon';

// 11. Writing: Evaluation & recommendations (Document + Checkmark & Star)
export const WritingCheck3DIcon = memo(() => {
  const uid = useId();
  const chkGrad = `wrtChkGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={chkGrad} x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#4c1d95" opacity="0.2" />

      <rect
        x="12"
        y="12"
        width="40"
        height="40"
        rx="5"
        fill="#f5f3ff"
        stroke="#ddd6fe"
        strokeWidth="1.5"
      />
      <line
        x1="18"
        y1="20"
        x2="36"
        y2="20"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="26"
        x2="32"
        y2="26"
        stroke="#7c3aed"
        strokeWidth="2"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* Large Glowing Check Badge */}
      <circle cx="36" cy="38" r="11" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
      <path
        d="M30 38L34 42L42 34"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
WritingCheck3DIcon.displayName = 'WritingCheck3DIcon';

// 12. Writing: Cohesion & precise qualification (Link Rings + Pen)
export const WritingLink3DIcon = memo(() => {
  const uid = useId();
  const linkGrad = `wrtLinkGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={linkGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#312e81" opacity="0.2" />

      {/* Interlocking Rings */}
      <rect
        x="12"
        y="20"
        width="26"
        height="24"
        rx="12"
        stroke={`url(#${linkGrad})`}
        strokeWidth="6.5"
        fill="none"
      />
      <rect
        x="26"
        y="20"
        width="26"
        height="24"
        rx="12"
        stroke="#a5b4fc"
        strokeWidth="6.5"
        fill="none"
      />
      <path
        d="M26 26C28 24 32 24 34 26"
        stroke={`url(#${linkGrad})`}
        strokeWidth="6.5"
        strokeLinecap="round"
      />

      {/* Quill Accent */}
      <path d="M44 10L36 22" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="44" cy="10" r="2" fill="#f59e0b" />
    </svg>
  );
});
WritingLink3DIcon.displayName = 'WritingLink3DIcon';

// ─── Existing Topic & Band 3D Icons (Optimized with React.memo) ───

export const Education3DIcon = memo(() => {
  const uid = useId();
  const capGrad = `capGrad-${uid}`;
  const bookGrad = `bookGrad-${uid}`;
  const bookGrad2 = `bookGrad2-${uid}`;
  const shadowGrad = `shadowGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={capGrad} x1="12" y1="14" x2="52" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient
          id={bookGrad}
          x1="14"
          y1="36"
          x2="50"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <linearGradient
          id={bookGrad2}
          x1="18"
          y1="44"
          x2="46"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
        <radialGradient id={shadowGrad} cx="32" cy="56" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7e22ce" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="32" cy="56" rx="20" ry="5" fill={`url(#${shadowGrad})`} />
      <rect x="14" y="44" width="36" height="8" rx="3" fill={`url(#${bookGrad2})`} />
      <rect x="18" y="46" width="32" height="4" rx="1.5" fill="#f3e8ff" opacity="0.9" />
      <rect x="12" y="36" width="40" height="9" rx="3.5" fill={`url(#${bookGrad})`} />
      <rect x="16" y="38" width="36" height="5" rx="1.5" fill="#ffffff" opacity="0.95" />

      <path
        d="M22 23.5V30.5C22 33 26.5 35 32 35C37.5 35 42 33 42 30.5V23.5"
        fill="#7e22ce"
        opacity="0.9"
      />
      <path
        d="M24 25.5V30.5C24 32.5 27.5 34 32 34C36.5 34 40 32.5 40 30.5V25.5"
        fill={`url(#${capGrad})`}
      />
      <path d="M32 10L54 20L32 30L10 20L32 10Z" fill={`url(#${capGrad})`} />
      <circle cx="32" cy="20" r="2.5" fill="#fbbf24" />
      <path d="M32 20C38 22 45 27 45 34" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="45" cy="34" r="2" fill="#f59e0b" />
    </svg>
  );
});
Education3DIcon.displayName = 'Education3DIcon';

export const Health3DIcon = memo(() => {
  const uid = useId();
  const heartGrad = `heartGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={heartGrad}
          x1="12"
          y1="10"
          x2="52"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="40%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#be185d" opacity="0.2" />
      <path
        d="M32 52C32 52 10 38 10 24.5C10 16.5 16.5 10 24.5 10C28.8 10 31.5 12.2 32 13.5C32.5 12.2 35.2 10 39.5 10C47.5 10 54 16.5 54 24.5C54 38 32 52 32 52Z"
        fill={`url(#${heartGrad})`}
      />
      <circle cx="21" cy="18" r="3" fill="#ffffff" opacity="0.4" />
      <path
        d="M13 31H22L26 21L31 41L37 25L41 33H51"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
Health3DIcon.displayName = 'Health3DIcon';

export const Work3DIcon = memo(() => {
  const uid = useId();
  const caseGrad = `caseGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={caseGrad}
          x1="10"
          y1="20"
          x2="54"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="55" rx="20" ry="4" fill="#047857" opacity="0.25" />
      <path
        d="M24 22V16C24 13.8 25.8 12 28 12H36C38.2 12 40 13.8 40 16V22"
        stroke="#065f46"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="10" y="20" width="44" height="32" rx="7" fill={`url(#${caseGrad})`} />
      <rect x="28" y="29" width="8" height="7" rx="2" fill="#ffffff" />
      <rect x="30" y="31" width="4" height="3" rx="1" fill="#047857" />
    </svg>
  );
});
Work3DIcon.displayName = 'Work3DIcon';

export const Government3DIcon = memo(() => {
  const uid = useId();
  const bldgGrad = `bldgGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={bldgGrad}
          x1="12"
          y1="14"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="60%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="22" ry="4" fill="#1e3a8a" opacity="0.2" />
      <path d="M32 20V8" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M32 9C34 7.5 37 10 39 9C41 8 43 9.5 43 9.5V15C43 15 41 13.5 39 14.5C37 15.5 34 13 32 14.5V9Z"
        fill="#3b82f6"
      />
      <path d="M32 19L53 29H11L32 19Z" fill="#93c5fd" />
      <rect x="13" y="29" width="38" height="4" rx="1" fill="#dbeafe" />
      <rect x="16" y="33" width="5" height="15" rx="1.5" fill={`url(#${bldgGrad})`} />
      <rect x="25" y="33" width="5" height="15" rx="1.5" fill={`url(#${bldgGrad})`} />
      <rect x="34" y="33" width="5" height="15" rx="1.5" fill={`url(#${bldgGrad})`} />
      <rect x="43" y="33" width="5" height="15" rx="1.5" fill={`url(#${bldgGrad})`} />
      <rect x="9" y="51" width="46" height="3" rx="1.5" fill="#2563eb" />
    </svg>
  );
});
Government3DIcon.displayName = 'Government3DIcon';

export const Media3DIcon = memo(() => {
  const uid = useId();
  const newsGrad = `newsGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={newsGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#c2410c" opacity="0.2" />
      <rect
        x="12"
        y="14"
        width="40"
        height="38"
        rx="5"
        fill="#fff7ed"
        stroke="#fdba74"
        strokeWidth="1.5"
      />
      <rect x="16" y="18" width="32" height="10" rx="3" fill={`url(#${newsGrad})`} />
      <text
        x="32"
        y="25.5"
        fill="#ffffff"
        fontSize="7"
        fontWeight="900"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        NEWS
      </text>
      <rect x="16" y="32" width="13" height="14" rx="2" fill="#fdba74" />
      <rect x="32" y="32" width="16" height="3" rx="1.5" fill="#f97316" />
      <rect x="32" y="37" width="14" height="2.5" rx="1.2" fill="#ea580c" opacity="0.6" />
      <rect x="32" y="42" width="16" height="2.5" rx="1.2" fill="#ea580c" opacity="0.6" />
    </svg>
  );
});
Media3DIcon.displayName = 'Media3DIcon';

export const Travel3DIcon = memo(() => {
  const uid = useId();
  const planeGrad = `planeGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={planeGrad}
          x1="14"
          y1="12"
          x2="52"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      <ellipse cx="28" cy="50" rx="16" ry="4" fill="#6d28d9" opacity="0.25" />
      <g transform="rotate(-15 32 32)">
        <path
          d="M48 16C50 14 52 14 53 16C54 18 53 20 50 23L38 34L22 48C20 50 18 51 17 50C16 49 16 47 18 45L31 31L48 16Z"
          fill={`url(#${planeGrad})`}
        />
        <path
          d="M33 28L15 20C13.5 19.5 13 18 14.5 17.5C16 17 19 18 22 20L38 27V28H33Z"
          fill="#a855f7"
        />
        <path
          d="M37 32L28 50C27.2 51.5 25.8 51.5 25.2 50C24.8 48.5 26 46 28 43L35 34V32H37Z"
          fill={`url(#${planeGrad})`}
        />
      </g>
    </svg>
  );
});
Travel3DIcon.displayName = 'Travel3DIcon';

export const Crime3DIcon = memo(() => {
  const uid = useId();
  const scaleGrad = `scaleGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={scaleGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#9f1239" opacity="0.2" />
      <rect x="30" y="16" width="4" height="35" rx="2" fill={`url(#${scaleGrad})`} />
      <circle cx="32" cy="14" r="3.5" fill="#fb7185" />
      <path d="M14 22H50" stroke={`url(#${scaleGrad})`} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M8 36C8 41 20 41 20 36H8Z" fill={`url(#${scaleGrad})`} />
      <path d="M44 36C44 41 56 41 56 36H44Z" fill={`url(#${scaleGrad})`} />
    </svg>
  );
});
Crime3DIcon.displayName = 'Crime3DIcon';

export const Cities3DIcon = memo(() => {
  const uid = useId();
  const bldgGrad1 = `bldgGrad1-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={bldgGrad1}
          x1="14"
          y1="18"
          x2="36"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="22" ry="4" fill="#0369a1" opacity="0.2" />
      <rect x="14" y="24" width="16" height="28" rx="3" fill={`url(#${bldgGrad1})`} />
      <rect x="28" y="14" width="22" height="38" rx="4" fill="#2563eb" />
      <rect x="32" y="18" width="4" height="4" rx="1" fill="#e0f2fe" />
      <rect x="42" y="18" width="4" height="4" rx="1" fill="#e0f2fe" />
      <rect x="32" y="25" width="4" height="4" rx="1" fill="#e0f2fe" />
      <rect x="42" y="25" width="4" height="4" rx="1" fill="#e0f2fe" />
    </svg>
  );
});
Cities3DIcon.displayName = 'Cities3DIcon';

export const Globalisation3DIcon = memo(() => {
  const uid = useId();
  const globeGrad = `globeGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={globeGrad} cx="26" cy="22" r="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#7c2d12" opacity="0.25" />
      <circle cx="32" cy="32" r="22" fill={`url(#${globeGrad})`} />
      <ellipse cx="32" cy="32" rx="22" ry="9" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
      <ellipse cx="32" cy="32" rx="9" ry="22" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
      <line x1="10" y1="32" x2="54" y2="32" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
    </svg>
  );
});
Globalisation3DIcon.displayName = 'Globalisation3DIcon';

export const Art3DIcon = memo(() => {
  const uid = useId();
  const paletteGrad = `paletteGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={paletteGrad}
          x1="10"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#115e59" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#115e59" opacity="0.25" />
      <path
        d="M34 10C45 10 54 18 54 28C54 36 48 40 42 40C38 40 37 44 38 47C39 49 37 52 32 52C19 52 10 43 10 30C10 18 20 10 34 10Z"
        fill={`url(#${paletteGrad})`}
      />
      <circle cx="42" cy="42" r="4" fill="#ffffff" />
      <circle cx="22" cy="20" r="3.5" fill="#f43f5e" />
      <circle cx="32" cy="18" r="3.5" fill="#fbbf24" />
      <circle cx="42" cy="22" r="3.5" fill="#3b82f6" />
    </svg>
  );
});
Art3DIcon.displayName = 'Art3DIcon';

export const Family3DIcon = memo(() => {
  const uid = useId();
  const figGrad = `figGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={figGrad} x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="22" ry="4" fill="#9f1239" opacity="0.2" />
      <circle cx="32" cy="20" r="7" fill={`url(#${figGrad})`} />
      <path d="M20 48C20 38 25 32 32 32C39 32 44 38 44 48H20Z" fill={`url(#${figGrad})`} />
      <circle cx="18" cy="25" r="5" fill="#f472b6" />
      <circle cx="46" cy="25" r="5" fill="#f472b6" />
    </svg>
  );
});
Family3DIcon.displayName = 'Family3DIcon';

export const Economy3DIcon = memo(() => {
  const uid = useId();
  const barGrad = `barGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={barGrad} x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#1e3a8a" opacity="0.2" />
      <rect x="12" y="36" width="10" height="16" rx="3" fill={`url(#${barGrad})`} opacity="0.7" />
      <rect x="27" y="26" width="10" height="26" rx="3" fill={`url(#${barGrad})`} opacity="0.85" />
      <rect x="42" y="16" width="10" height="36" rx="3" fill={`url(#${barGrad})`} />
      <path
        d="M12 40L24 28L36 32L50 14"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 14H50V26"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
Economy3DIcon.displayName = 'Economy3DIcon';

export const Science3DIcon = memo(() => {
  const uid = useId();
  const planetGrad = `planetGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={planetGrad} cx="26" cy="22" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="60%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#581c87" />
        </radialGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#581c87" opacity="0.25" />
      <circle cx="32" cy="32" r="18" fill={`url(#${planetGrad})`} />
      <path
        d="M56 24C58 30 48 38 34 42C20 46 8 44 12 36"
        stroke="#e9d5ff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="14" r="1.5" fill="#ffffff" />
      <circle cx="48" cy="12" r="2" fill="#ffffff" />
    </svg>
  );
});
Science3DIcon.displayName = 'Science3DIcon';

export const Sport3DIcon = memo(() => {
  const uid = useId();
  const ballGrad = `ballGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={ballGrad} cx="24" cy="20" r="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#7c2d12" opacity="0.25" />
      <circle cx="32" cy="32" r="22" fill={`url(#${ballGrad})`} />
      <path d="M10 32H54" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 10V54" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
});
Sport3DIcon.displayName = 'Sport3DIcon';

export const Language3DIcon = memo(() => {
  const uid = useId();
  const bubbleGrad = `bubbleGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={bubbleGrad}
          x1="10"
          y1="10"
          x2="54"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#db2777" />
          <stop offset="100%" stopColor="#9d174d" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#831843" opacity="0.2" />
      <rect x="10" y="22" width="36" height="26" rx="12" fill={`url(#${bubbleGrad})`} />
      <path d="M18 48L14 54L24 48H18Z" fill={`url(#${bubbleGrad})`} />
      <circle cx="21" cy="35" r="2.5" fill="#ffffff" />
      <circle cx="28" cy="35" r="2.5" fill="#ffffff" />
      <circle cx="35" cy="35" r="2.5" fill="#ffffff" />
    </svg>
  );
});
Language3DIcon.displayName = 'Language3DIcon';

export const Cohesion3DIcon = memo(() => {
  const uid = useId();
  const linkGrad = `linkGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={linkGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#1e3a8a" opacity="0.2" />
      <rect
        x="12"
        y="20"
        width="26"
        height="24"
        rx="12"
        stroke={`url(#${linkGrad})`}
        strokeWidth="7"
        fill="none"
      />
      <rect
        x="26"
        y="20"
        width="26"
        height="24"
        rx="12"
        stroke="#60a5fa"
        strokeWidth="7"
        fill="none"
      />
      <path
        d="M26 26C28 24 32 24 34 26"
        stroke={`url(#${linkGrad})`}
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
});
Cohesion3DIcon.displayName = 'Cohesion3DIcon';

export const Paraphrase3DIcon = memo(() => {
  const uid = useId();
  const docGrad = `docGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={docGrad} x1="12" y1="12" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#047857" opacity="0.2" />
      <rect
        x="12"
        y="14"
        width="36"
        height="38"
        rx="4"
        fill={`url(#${docGrad})`}
        stroke="#34d399"
        strokeWidth="1.5"
      />
      <circle
        cx="38"
        cy="34"
        r="11"
        fill="#ffffff"
        opacity="0.85"
        stroke="#10b981"
        strokeWidth="4"
      />
      <path d="M46 42L54 50" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
});
Paraphrase3DIcon.displayName = 'Paraphrase3DIcon';

export const Environment3DIcon = memo(() => {
  const uid = useId();
  const leafGrad = `leafGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={leafGrad}
          x1="12"
          y1="12"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#047857" opacity="0.25" />
      <path
        d="M50 14C50 14 30 14 18 28C10 38 14 50 28 50C44 50 50 30 50 14Z"
        fill={`url(#${leafGrad})`}
      />
      <path d="M20 46C26 38 36 26 50 14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
});
Environment3DIcon.displayName = 'Environment3DIcon';

export const Technology3DIcon = memo(() => {
  const uid = useId();
  const chipGrad = `chipGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={chipGrad}
          x1="14"
          y1="14"
          x2="50"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#0369a1" opacity="0.2" />
      <rect x="16" y="16" width="32" height="32" rx="6" fill={`url(#${chipGrad})`} />
      <text x="32" y="36" fill="#0284c7" fontSize="10" fontWeight="900" textAnchor="middle">
        AI
      </text>
    </svg>
  );
});
Technology3DIcon.displayName = 'Technology3DIcon';

export const TargetBand3DIcon = memo(() => {
  const uid = useId();
  const targetGrad = `targetGrad-${uid}`;

  return (
    <svg
      className="w-full h-full shrink-0 transform-gpu"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={targetGrad} cx="32" cy="32" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>

      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#78350f" opacity="0.25" />
      <circle cx="32" cy="32" r="22" fill={`url(#${targetGrad})`} />
      <circle cx="32" cy="32" r="15" fill="#ffffff" />
      <circle cx="32" cy="32" r="9" fill="#f59e0b" />
      <path d="M46 14L32 28" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
});
TargetBand3DIcon.displayName = 'TargetBand3DIcon';

// ─── Theme Mapping helper ───
export const KIT_THEMES = {
  speaking: {
    panel:
      'bg-linear-to-br/srgb from-[#f0fdf4] via-[#e6fcf0] to-[#d1fae5] dark:from-emerald-950/30 dark:via-emerald-950/25 dark:to-teal-950/20',
    border: 'border-[#a7f3d0] dark:border-emerald-800/40 hover:border-emerald-400',
    arrow: 'text-emerald-600 dark:text-emerald-400',
    iconBg:
      'bg-white dark:bg-emerald-950/50 shadow-[0_10px_25px_-6px_rgba(16,185,129,0.25)] border border-emerald-100 dark:border-emerald-900/50',
    badge:
      'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(16,185,129,0.35)]',
  },
  reading: {
    panel:
      'bg-linear-to-br/srgb from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd] dark:from-sky-950/30 dark:via-sky-950/25 dark:to-blue-950/20',
    border: 'border-[#7dd3fc] dark:border-sky-800/40 hover:border-sky-400',
    arrow: 'text-sky-600 dark:text-sky-400',
    iconBg:
      'bg-white dark:bg-sky-950/50 shadow-[0_10px_25px_-6px_rgba(14,165,233,0.25)] border border-sky-100 dark:border-sky-900/50',
    badge: 'bg-sky-100/90 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(14,165,233,0.35)]',
  },
  writing: {
    panel:
      'bg-linear-to-br/srgb from-[#f5f3ff] via-[#ede9fe] to-[#ddd6fe] dark:from-violet-950/30 dark:via-violet-950/25 dark:to-purple-950/20',
    border: 'border-[#c4b5fd] dark:border-violet-800/40 hover:border-violet-400',
    arrow: 'text-violet-600 dark:text-violet-400',
    iconBg:
      'bg-white dark:bg-violet-950/50 shadow-[0_10px_25px_-6px_rgba(139,92,246,0.25)] border border-violet-100 dark:border-violet-900/50',
    badge:
      'bg-violet-100/90 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(139,92,246,0.35)]',
  },
  education: {
    panel:
      'bg-linear-to-br/srgb from-[#faf8ff] via-[#f5edff] to-[#eeddff] dark:from-purple-950/30 dark:via-purple-950/25 dark:to-indigo-950/20',
    border: 'border-[#e4cdff] dark:border-purple-800/40 hover:border-purple-400',
    arrow: 'text-purple-600 dark:text-purple-400',
    iconBg:
      'bg-white dark:bg-purple-950/50 shadow-[0_10px_25px_-6px_rgba(147,51,234,0.2)] border border-purple-100 dark:border-purple-900/50',
    badge:
      'bg-purple-100/90 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(147,51,234,0.3)]',
  },
  health: {
    panel:
      'bg-linear-to-br/srgb from-[#fff5f7] via-[#ffeaf0] to-[#ffdce5] dark:from-pink-950/30 dark:via-pink-950/25 dark:to-rose-950/20',
    border: 'border-[#fcc2d0] dark:border-pink-800/40 hover:border-pink-400',
    arrow: 'text-pink-600 dark:text-pink-400',
    iconBg:
      'bg-white dark:bg-pink-950/50 shadow-[0_10px_25px_-6px_rgba(236,72,153,0.2)] border border-pink-100 dark:border-pink-900/50',
    badge: 'bg-pink-100/90 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(236,72,153,0.3)]',
  },
  work: {
    panel:
      'bg-linear-to-br/srgb from-[#f0fdf4] via-[#e4fbf0] to-[#d1fae5] dark:from-emerald-950/30 dark:via-emerald-950/25 dark:to-teal-950/20',
    border: 'border-[#a7f3d0] dark:border-emerald-800/40 hover:border-emerald-400',
    arrow: 'text-emerald-600 dark:text-emerald-400',
    iconBg:
      'bg-white dark:bg-emerald-950/50 shadow-[0_10px_25px_-6px_rgba(16,185,129,0.2)] border border-emerald-100 dark:border-emerald-900/50',
    badge:
      'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(16,185,129,0.3)]',
  },
  government: {
    panel:
      'bg-linear-to-br/srgb from-[#eff6ff] via-[#e0edff] to-[#c7dffff] dark:from-blue-950/30 dark:via-blue-950/25 dark:to-indigo-950/20',
    border: 'border-[#b8d5ff] dark:border-blue-800/40 hover:border-blue-400',
    arrow: 'text-blue-600 dark:text-blue-400',
    iconBg:
      'bg-white dark:bg-blue-950/50 shadow-[0_10px_25px_-6px_rgba(59,130,246,0.2)] border border-blue-100 dark:border-blue-900/50',
    badge: 'bg-blue-100/90 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(59,130,246,0.3)]',
  },
  media: {
    panel:
      'bg-linear-to-br/srgb from-[#fff7ed] via-[#ffedd5] to-[#ffe2bc] dark:from-amber-950/30 dark:via-amber-950/25 dark:to-orange-950/20',
    border: 'border-[#fccb96] dark:border-amber-800/40 hover:border-amber-400',
    arrow: 'text-amber-600 dark:text-amber-400',
    iconBg:
      'bg-white dark:bg-amber-950/50 shadow-[0_10px_25px_-6px_rgba(249,115,22,0.2)] border border-amber-100 dark:border-amber-900/50',
    badge: 'bg-amber-100/90 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(249,115,22,0.3)]',
  },
  travel: {
    panel:
      'bg-linear-to-br/srgb from-[#f5f3ff] via-[#ede9fe] to-[#e0d7fe] dark:from-violet-950/30 dark:via-violet-950/25 dark:to-purple-950/20',
    border: 'border-[#d4c7fe] dark:border-violet-800/40 hover:border-violet-400',
    arrow: 'text-violet-600 dark:text-violet-400',
    iconBg:
      'bg-white dark:bg-violet-950/50 shadow-[0_10px_25px_-6px_rgba(139,92,246,0.2)] border border-violet-100 dark:border-violet-900/50',
    badge:
      'bg-violet-100/90 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(139,92,246,0.3)]',
  },
  crime: {
    panel:
      'bg-linear-to-br/srgb from-[#fff1f2] via-[#ffe4e6] to-[#ffd4d8] dark:from-rose-950/30 dark:via-rose-950/25 dark:to-pink-950/20',
    border: 'border-[#fbb6c2] dark:border-rose-800/40 hover:border-rose-400',
    arrow: 'text-rose-600 dark:text-rose-400',
    iconBg:
      'bg-white dark:bg-rose-950/50 shadow-[0_10px_25px_-6px_rgba(244,63,94,0.2)] border border-rose-100 dark:border-rose-900/50',
    badge: 'bg-rose-100/90 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(244,63,94,0.3)]',
  },
  cities: {
    panel:
      'bg-linear-to-br/srgb from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd] dark:from-sky-950/30 dark:via-sky-950/25 dark:to-blue-950/20',
    border: 'border-[#7dd3fc] dark:border-sky-800/40 hover:border-sky-400',
    arrow: 'text-sky-600 dark:text-sky-400',
    iconBg:
      'bg-white dark:bg-sky-950/50 shadow-[0_10px_25px_-6px_rgba(14,165,233,0.2)] border border-sky-100 dark:border-sky-900/50',
    badge: 'bg-sky-100/90 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(14,165,233,0.3)]',
  },
  globalisation: {
    panel:
      'bg-linear-to-br/srgb from-[#fff7ed] via-[#ffedd5] to-[#fed7aa] dark:from-orange-950/30 dark:via-orange-950/25 dark:to-amber-950/20',
    border: 'border-[#fdba74] dark:border-orange-800/40 hover:border-orange-400',
    arrow: 'text-orange-600 dark:text-orange-400',
    iconBg:
      'bg-white dark:bg-orange-950/50 shadow-[0_10px_25px_-6px_rgba(234,88,12,0.2)] border border-orange-100 dark:border-orange-900/50',
    badge:
      'bg-orange-100/90 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(234,88,12,0.3)]',
  },
  art: {
    panel:
      'bg-linear-to-br/srgb from-[#f0fdfa] via-[#ccfbf1] to-[#99f6e4] dark:from-teal-950/30 dark:via-teal-950/25 dark:to-emerald-950/20',
    border: 'border-[#5eead4] dark:border-teal-800/40 hover:border-teal-400',
    arrow: 'text-teal-600 dark:text-teal-400',
    iconBg:
      'bg-white dark:bg-teal-950/50 shadow-[0_10px_25px_-6px_rgba(20,184,166,0.2)] border border-teal-100 dark:border-teal-900/50',
    badge: 'bg-teal-100/90 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(20,184,166,0.3)]',
  },
  family: {
    panel:
      'bg-linear-to-br/srgb from-[#fff1f2] via-[#ffe4e6] to-[#fecdd3] dark:from-pink-950/30 dark:via-pink-950/25 dark:to-rose-950/20',
    border: 'border-[#fda4af] dark:border-pink-800/40 hover:border-pink-400',
    arrow: 'text-pink-600 dark:text-pink-400',
    iconBg:
      'bg-white dark:bg-pink-950/50 shadow-[0_10px_25px_-6px_rgba(225,29,72,0.2)] border border-pink-100 dark:border-pink-900/50',
    badge: 'bg-pink-100/90 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(225,29,72,0.3)]',
  },
  economy: {
    panel:
      'bg-linear-to-br/srgb from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] dark:from-blue-950/30 dark:via-blue-950/25 dark:to-indigo-950/20',
    border: 'border-[#93c5fd] dark:border-blue-800/40 hover:border-blue-400',
    arrow: 'text-blue-600 dark:text-blue-400',
    iconBg:
      'bg-white dark:bg-blue-950/50 shadow-[0_10px_25px_-6px_rgba(37,99,235,0.2)] border border-blue-100 dark:border-blue-900/50',
    badge: 'bg-blue-100/90 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(37,99,235,0.3)]',
  },
  science: {
    panel:
      'bg-linear-to-br/srgb from-[#faf5ff] via-[#f3e8ff] to-[#e9d5ff] dark:from-purple-950/30 dark:via-purple-950/25 dark:to-violet-950/20',
    border: 'border-[#d8b4fe] dark:border-purple-800/40 hover:border-purple-400',
    arrow: 'text-purple-600 dark:text-purple-400',
    iconBg:
      'bg-white dark:bg-purple-950/50 shadow-[0_10px_25px_-6px_rgba(124,58,237,0.2)] border border-purple-100 dark:border-purple-900/50',
    badge:
      'bg-purple-100/90 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(124,58,237,0.3)]',
  },
  sport: {
    panel:
      'bg-linear-to-br/srgb from-[#fff7ed] via-[#ffedd5] to-[#fed7aa] dark:from-amber-950/30 dark:via-amber-950/25 dark:to-orange-950/20',
    border: 'border-[#fdba74] dark:border-amber-800/40 hover:border-amber-400',
    arrow: 'text-amber-600 dark:text-amber-400',
    iconBg:
      'bg-white dark:bg-amber-950/50 shadow-[0_10px_25px_-6px_rgba(249,115,22,0.2)] border border-amber-100 dark:border-amber-900/50',
    badge: 'bg-amber-100/90 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(249,115,22,0.3)]',
  },
  language: {
    panel:
      'bg-linear-to-br/srgb from-[#fdf2f8] via-[#fce7f3] to-[#fbcfe8] dark:from-pink-950/30 dark:via-pink-950/25 dark:to-rose-950/20',
    border: 'border-[#f472b6] dark:border-pink-800/40 hover:border-pink-400',
    arrow: 'text-pink-600 dark:text-pink-400',
    iconBg:
      'bg-white dark:bg-pink-950/50 shadow-[0_10px_25px_-6px_rgba(219,39,119,0.2)] border border-pink-100 dark:border-pink-900/50',
    badge: 'bg-pink-100/90 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(219,39,119,0.3)]',
  },
  cohesion: {
    panel:
      'bg-linear-to-br/srgb from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] dark:from-blue-950/30 dark:via-blue-950/25 dark:to-sky-950/20',
    border: 'border-[#93c5fd] dark:border-blue-800/40 hover:border-blue-400',
    arrow: 'text-blue-600 dark:text-blue-400',
    iconBg:
      'bg-white dark:bg-blue-950/50 shadow-[0_10px_25px_-6px_rgba(59,130,246,0.2)] border border-blue-100 dark:border-blue-900/50',
    badge: 'bg-blue-100/90 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(59,130,246,0.3)]',
  },
  paraphrase: {
    panel:
      'bg-linear-to-br/srgb from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0] dark:from-teal-950/30 dark:via-teal-950/25 dark:to-emerald-950/20',
    border: 'border-[#6ee7b7] dark:border-teal-800/40 hover:border-teal-400',
    arrow: 'text-teal-600 dark:text-teal-400',
    iconBg:
      'bg-white dark:bg-teal-950/50 shadow-[0_10px_25px_-6px_rgba(16,185,129,0.2)] border border-teal-100 dark:border-teal-900/50',
    badge: 'bg-teal-100/90 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(16,185,129,0.3)]',
  },
  environment: {
    panel:
      'bg-linear-to-br/srgb from-[#f0fdf4] via-[#dcfce7] to-[#bbf7d0] dark:from-emerald-950/30 dark:via-emerald-950/25 dark:to-green-950/20',
    border: 'border-[#86efac] dark:border-emerald-800/40 hover:border-emerald-400',
    arrow: 'text-emerald-600 dark:text-emerald-400',
    iconBg:
      'bg-white dark:bg-emerald-950/50 shadow-[0_10px_25px_-6px_rgba(5,150,105,0.2)] border border-emerald-100 dark:border-emerald-900/50',
    badge:
      'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(5,150,105,0.3)]',
  },
  technology: {
    panel:
      'bg-linear-to-br/srgb from-[#ecfeff] via-[#cffaff] to-[#a5f3fc] dark:from-cyan-950/30 dark:via-cyan-950/25 dark:to-sky-950/20',
    border: 'border-[#67e8f9] dark:border-cyan-800/40 hover:border-cyan-400',
    arrow: 'text-cyan-600 dark:text-cyan-400',
    iconBg:
      'bg-white dark:bg-cyan-950/50 shadow-[0_10px_25px_-6px_rgba(6,182,212,0.2)] border border-cyan-100 dark:border-cyan-900/50',
    badge: 'bg-cyan-100/90 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(6,182,212,0.3)]',
  },
  targetBand: {
    panel:
      'bg-linear-to-br/srgb from-[#fffbeb] via-[#fef3c7] to-[#fde68a] dark:from-amber-950/30 dark:via-amber-950/25 dark:to-yellow-950/20',
    border: 'border-[#fcd34d] dark:border-amber-800/40 hover:border-amber-400',
    arrow: 'text-amber-600 dark:text-amber-400',
    iconBg:
      'bg-white dark:bg-amber-950/50 shadow-[0_10px_25px_-6px_rgba(245,158,11,0.25)] border border-amber-100 dark:border-amber-900/50',
    badge: 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-extrabold',
    hoverGlow: 'hover:shadow-[0_18px_38px_-16px_rgba(245,158,11,0.35)]',
  },
};

// Precise Key resolver mapping every kit to its dedicated icon key
export function getKitKey(kit) {
  const text =
    `${kit?.id || ''} ${kit?.slug || ''} ${kit?.title || ''} ${kit?.category || ''}`.toLowerCase();

  // 1. Speaking Kits Specific Sub-types
  if (text.includes('speaking')) {
    if (text.includes('agree') || text.includes('balance') || text.includes('disagree'))
      return 'speaking-dialogue';
    if (text.includes('fluency') || text.includes('explanation') || text.includes('example'))
      return 'speaking-megaphone';
    if (text.includes('describ') || text.includes('people') || text.includes('experience'))
      return 'speaking-avatar';
    return 'speaking-mic';
  }

  // 2. Reading Kits Specific Sub-types
  if (text.includes('reading')) {
    if (text.includes('cause') || text.includes('effect') || text.includes('relationship'))
      return 'reading-glass';
    if (text.includes('change') || text.includes('quantity') || text.includes('comparison'))
      return 'reading-chart';
    if (text.includes('attitude') || text.includes('author') || text.includes('evaluation'))
      return 'reading-star';
    return 'reading-book';
  }

  // 3. Writing Kits Specific Sub-types
  if (text.includes('writing')) {
    if (text.includes('analysis') || text.includes('consequence')) return 'writing-nodes';
    if (text.includes('recommendation') || text.includes('evaluation')) return 'writing-check';
    if (text.includes('cohesion') || text.includes('qualification')) return 'writing-link';
    return 'writing-pen';
  }

  // 4. Target Band Kits
  if (text.includes('band')) return 'targetBand';

  // 5. Topic Kits
  if (text.includes('education')) return 'education';
  if (text.includes('health') || text.includes('medicine')) return 'health';
  if (text.includes('work') || text.includes('employment')) return 'work';
  if (text.includes('government') || text.includes('politics')) return 'government';
  if (text.includes('media') || text.includes('information')) return 'media';
  if (text.includes('travel') || text.includes('tourism')) return 'travel';
  if (text.includes('crime') || text.includes('law')) return 'crime';
  if (text.includes('cit') || text.includes('urban')) return 'cities';
  if (text.includes('global') || text.includes('culture')) return 'globalisation';
  if (text.includes('art') || text.includes('heritage') || text.includes('creativ')) return 'art';
  if (text.includes('fam') || text.includes('societ')) return 'family';
  if (text.includes('econom') || text.includes('business')) return 'economy';
  if (text.includes('science') || text.includes('space')) return 'science';
  if (text.includes('sport') || text.includes('leisure')) return 'sport';
  if (text.includes('task 1') || text.includes('data description')) return 'language';
  if (text.includes('cohesion') || text.includes('discourse')) return 'cohesion';
  if (text.includes('paraphrase') || text.includes('repetition')) return 'paraphrase';
  if (text.includes('environ') || text.includes('nature')) return 'environment';
  if (text.includes('tech') || text.includes('digital')) return 'technology';

  return 'education';
}

export function getKitTheme(kit) {
  const key = getKitKey(kit);

  if (key.startsWith('speaking')) {
    return {
      panel: 'from-[#fcfffd] to-[#edf9f3] dark:from-emerald-950/20 dark:to-teal-950/10',
      border: 'border-[#e0f5ea] dark:border-emerald-500/20 hover:border-emerald-300',
      arrow: 'text-emerald-600 dark:text-emerald-400',
      tag: 'text-emerald-600 dark:text-emerald-400',
      hoverGlow: 'hover:shadow-[0_16px_32px_-24px_rgba(16,185,129,0.5)]',
    };
  }

  if (key.startsWith('reading')) {
    return {
      panel: 'from-[#fcfeff] to-[#edf5ff] dark:from-blue-950/20 dark:to-sky-950/10',
      border: 'border-[#e0eeff] dark:border-blue-500/20 hover:border-blue-300',
      arrow: 'text-blue-600 dark:text-blue-400',
      tag: 'text-blue-600 dark:text-blue-400',
      hoverGlow: 'hover:shadow-[0_16px_32px_-24px_rgba(59,130,246,0.5)]',
    };
  }

  if (key.startsWith('writing')) {
    return {
      panel: 'from-[#fdfcff] to-[#f3efff] dark:from-violet-950/20 dark:to-purple-950/10',
      border: 'border-[#eceafa] dark:border-violet-500/20 hover:border-violet-300',
      arrow: 'text-violet-600 dark:text-violet-400',
      tag: 'text-violet-600 dark:text-violet-400',
      hoverGlow: 'hover:shadow-[0_16px_32px_-24px_rgba(139,92,246,0.5)]',
    };
  }

  if (key === 'targetBand' || key.includes('band')) {
    return {
      panel: 'from-[#fffefd] to-[#fff3e9] dark:from-amber-950/20 dark:to-orange-950/10',
      border: 'border-[#fdecdb] dark:border-amber-500/20 hover:border-amber-300',
      arrow: 'text-amber-600 dark:text-amber-400',
      tag: 'text-amber-600 dark:text-amber-400',
      hoverGlow: 'hover:shadow-[0_16px_32px_-24px_rgba(245,158,11,0.5)]',
    };
  }

  if (['environment', 'science', 'technology', 'cities'].includes(key)) {
    return {
      panel: 'from-[#fcfeff] to-[#eaf8fb] dark:from-cyan-950/20 dark:to-sky-950/10',
      border: 'border-[#dcf3f8] dark:border-cyan-500/20 hover:border-cyan-300',
      arrow: 'text-cyan-600 dark:text-cyan-400',
      tag: 'text-cyan-600 dark:text-cyan-400',
      hoverGlow: 'hover:shadow-[0_16px_32px_-24px_rgba(6,182,212,0.5)]',
    };
  }

  if (['art', 'media', 'family', 'sport'].includes(key)) {
    return {
      panel: 'from-[#fffdfd] to-[#fff0f8] dark:from-pink-950/20 dark:to-rose-950/10',
      border: 'border-[#fde8f4] dark:border-pink-500/20 hover:border-pink-300',
      arrow: 'text-rose-600 dark:text-rose-400',
      tag: 'text-rose-600 dark:text-rose-400',
      hoverGlow: 'hover:shadow-[0_16px_32px_-24px_rgba(244,63,94,0.5)]',
    };
  }

  return {
    panel: 'from-[#fdfcff] to-[#f3efff] dark:from-indigo-950/20 dark:to-violet-950/10',
    border: 'border-[#eceafa] dark:border-indigo-500/20 hover:border-indigo-300',
    arrow: 'text-indigo-600 dark:text-indigo-400',
    tag: 'text-indigo-600 dark:text-indigo-400',
    hoverGlow: 'hover:shadow-[0_16px_32px_-24px_rgba(99,102,241,0.5)]',
  };
}

export const Kit3DIcon = memo(({ kit, id, title, category }) => {
  const key = getKitKey(kit || { id, title, category });

  switch (key) {
    // Speaking
    case 'speaking-mic':
      return <SpeakingMic3DIcon />;
    case 'speaking-dialogue':
      return <SpeakingDialogue3DIcon />;
    case 'speaking-megaphone':
      return <SpeakingMegaphone3DIcon />;
    case 'speaking-avatar':
      return <SpeakingAvatar3DIcon />;

    // Reading
    case 'reading-book':
      return <ReadingBook3DIcon />;
    case 'reading-glass':
      return <ReadingGlass3DIcon />;
    case 'reading-chart':
      return <ReadingChart3DIcon />;
    case 'reading-star':
      return <ReadingStar3DIcon />;

    // Writing
    case 'writing-pen':
      return <WritingPen3DIcon />;
    case 'writing-nodes':
      return <WritingNodes3DIcon />;
    case 'writing-check':
      return <WritingCheck3DIcon />;
    case 'writing-link':
      return <WritingLink3DIcon />;

    // Band
    case 'targetBand':
      return <TargetBand3DIcon />;

    // Topics
    case 'education':
      return <Education3DIcon />;
    case 'health':
      return <Health3DIcon />;
    case 'work':
      return <Work3DIcon />;
    case 'government':
      return <Government3DIcon />;
    case 'media':
      return <Media3DIcon />;
    case 'travel':
      return <Travel3DIcon />;
    case 'crime':
      return <Crime3DIcon />;
    case 'cities':
      return <Cities3DIcon />;
    case 'globalisation':
      return <Globalisation3DIcon />;
    case 'art':
      return <Art3DIcon />;
    case 'family':
      return <Family3DIcon />;
    case 'economy':
      return <Economy3DIcon />;
    case 'science':
      return <Science3DIcon />;
    case 'sport':
      return <Sport3DIcon />;
    case 'language':
      return <Language3DIcon />;
    case 'cohesion':
      return <Cohesion3DIcon />;
    case 'paraphrase':
      return <Paraphrase3DIcon />;
    case 'environment':
      return <Environment3DIcon />;
    case 'technology':
      return <Technology3DIcon />;

    default:
      return <Education3DIcon />;
  }
});
Kit3DIcon.displayName = 'Kit3DIcon';

export default Kit3DIcon;
