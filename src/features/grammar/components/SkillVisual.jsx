import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Renders a decorative SVG illustration for a given grammar skill or specific guide unit (1 to 18).
 * Ensures all text elements are strictly contained inside SVG bounding boxes with generous padding.
 */

function Unit1Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(124, 58, 237, 0.2))">
        <rect
          x="5"
          y="9"
          width="26"
          height="28"
          rx="7"
          fill={`url(#v1-1-${uid})`}
          stroke="#C4B5FD"
          strokeWidth="1.2"
        />
        <text
          x="18"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="900"
          fill="#6D28D9"
          fontFamily="sans-serif"
        >
          S + V
        </text>
        <rect
          x="36"
          y="6"
          width="27"
          height="34"
          rx="8"
          fill={`url(#v1-2-${uid})`}
          stroke="#A78BFA"
          strokeWidth="1.2"
        />
        <text
          x="49.5"
          y="22"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="900"
          fill="#5B21B6"
          fontFamily="sans-serif"
        >
          Clause
        </text>
        <circle cx="49.5" cy="30" r="2.5" fill="#5B21B6" />
      </g>
      <defs>
        <linearGradient
          id={`v1-1-${uid}`}
          x1="5"
          y1="9"
          x2="31"
          y2="37"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F5F3FF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
        <linearGradient
          id={`v1-2-${uid}`}
          x1="36"
          y1="6"
          x2="63"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EDE9FE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit2Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(5, 150, 105, 0.2))">
        <rect
          x="4"
          y="6"
          width="32"
          height="15"
          rx="4"
          fill={`url(#u2-1-${uid})`}
          stroke="#A7F3D0"
          strokeWidth="1.2"
        />
        <text
          x="20"
          y="16.5"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="#065F46"
          fontFamily="sans-serif"
        >
          They
        </text>
        <rect
          x="38"
          y="6"
          width="26"
          height="15"
          rx="4"
          fill={`url(#u2-2-${uid})`}
          stroke="#6EE7B7"
          strokeWidth="1.2"
        />
        <text
          x="51"
          y="16.5"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="#047857"
          fontFamily="sans-serif"
        >
          are
        </text>

        <rect
          x="4"
          y="25"
          width="32"
          height="15"
          rx="4"
          fill={`url(#u2-1-${uid})`}
          stroke="#A7F3D0"
          strokeWidth="1.2"
        />
        <text
          x="20"
          y="35.5"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="800"
          fill="#065F46"
          fontFamily="sans-serif"
        >
          Team
        </text>
        <rect
          x="38"
          y="25"
          width="26"
          height="15"
          rx="4"
          fill={`url(#u2-2-${uid})`}
          stroke="#6EE7B7"
          strokeWidth="1.2"
        />
        <text
          x="51"
          y="35.5"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="#047857"
          fontFamily="sans-serif"
        >
          is
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u2-1-${uid}`}
          x1="4"
          y1="6"
          x2="36"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ECFDF5" />
          <stop offset="1" stopColor="#D1FAE5" />
        </linearGradient>
        <linearGradient
          id={`u2-2-${uid}`}
          x1="38"
          y1="6"
          x2="64"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A7F3D0" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit3Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(5, 150, 105, 0.2))">
        <rect
          x="5"
          y="6"
          width="27"
          height="34"
          rx="6"
          fill={`url(#u3-1-${uid})`}
          stroke="#A7F3D0"
          strokeWidth="1.2"
        />
        <text
          x="18.5"
          y="20"
          textAnchor="middle"
          fontSize="7"
          fontWeight="900"
          fill="#065F46"
          fontFamily="sans-serif"
        >
          COUNT
        </text>
        <text
          x="18.5"
          y="31"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#047857"
          fontFamily="sans-serif"
        >
          1..∞
        </text>

        <rect
          x="36"
          y="6"
          width="27"
          height="34"
          rx="6"
          fill={`url(#u3-2-${uid})`}
          stroke="#6EE7B7"
          strokeWidth="1.2"
        />
        <text
          x="49.5"
          y="20"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#047857"
          fontFamily="sans-serif"
        >
          MASS
        </text>
        <text
          x="49.5"
          y="31"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="900"
          fill="#065F46"
          fontFamily="sans-serif"
        >
          much
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u3-1-${uid}`}
          x1="5"
          y1="6"
          x2="32"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0FDF4" />
          <stop offset="1" stopColor="#DCFCE7" />
        </linearGradient>
        <linearGradient
          id={`u3-2-${uid}`}
          x1="36"
          y1="6"
          x2="63"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DCFCE7" />
          <stop offset="1" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit4Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(217, 119, 6, 0.2))">
        <rect
          x="5"
          y="16"
          width="16"
          height="22"
          rx="4"
          fill={`url(#u4-1-${uid})`}
          stroke="#FDE68A"
          strokeWidth="1.2"
        />
        <text
          x="13"
          y="31"
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#B45309"
          fontFamily="sans-serif"
        >
          a
        </text>

        <rect
          x="23"
          y="7"
          width="20"
          height="22"
          rx="4"
          fill={`url(#u4-2-${uid})`}
          stroke="#FCD34D"
          strokeWidth="1.2"
        />
        <text
          x="33"
          y="22"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="900"
          fill="#92400E"
          fontFamily="sans-serif"
        >
          an
        </text>

        <rect
          x="45"
          y="16"
          width="18"
          height="22"
          rx="4"
          fill={`url(#u4-3-${uid})`}
          stroke="#FBBF24"
          strokeWidth="1.2"
        />
        <text
          x="54"
          y="31"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="900"
          fill="#78350F"
          fontFamily="sans-serif"
        >
          the
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u4-1-${uid}`}
          x1="5"
          y1="16"
          x2="21"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFBEB" />
          <stop offset="1" stopColor="#FDE68A" />
        </linearGradient>
        <linearGradient
          id={`u4-2-${uid}`}
          x1="23"
          y1="7"
          x2="43"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FEF3C7" />
          <stop offset="1" stopColor="#FCD34D" />
        </linearGradient>
        <linearGradient
          id={`u4-3-${uid}`}
          x1="45"
          y1="16"
          x2="63"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit5Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(2, 132, 199, 0.2))">
        <rect
          x="6"
          y="12"
          width="20"
          height="22"
          rx="5"
          fill={`url(#u5-1-${uid})`}
          stroke="#BAE6FD"
          strokeWidth="1.2"
        />
        <text
          x="16"
          y="26"
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#0369A1"
          fontFamily="sans-serif"
        >
          it
        </text>

        <path
          d="M28 23H38M38 23L34 19M38 23L34 27"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="40"
          y="12"
          width="22"
          height="22"
          rx="5"
          fill={`url(#u5-2-${uid})`}
          stroke="#7DD3FC"
          strokeWidth="1.2"
        />
        <text
          x="51"
          y="26"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#0284C7"
          fontFamily="sans-serif"
        >
          ref
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u5-1-${uid}`}
          x1="6"
          y1="12"
          x2="26"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0F9FF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
        <linearGradient
          id={`u5-2-${uid}`}
          x1="40"
          y1="12"
          x2="62"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit6Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(37, 99, 235, 0.2))">
        <path
          d="M6 34C18 34 22 28 34 28C46 28 50 34 62 34"
          stroke="#60A5FA"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="34" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="34" cy="28" r="4.5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="56" cy="34" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.8" />

        <rect
          x="6"
          y="7"
          width="22"
          height="15"
          rx="4"
          fill={`url(#u6-1-${uid})`}
          stroke="#93C5FD"
          strokeWidth="1.2"
        />
        <text
          x="17"
          y="17.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#1E40AF"
          fontFamily="sans-serif"
        >
          -ed
        </text>

        <rect
          x="38"
          y="5"
          width="24"
          height="16"
          rx="4"
          fill={`url(#u6-2-${uid})`}
          stroke="#60A5FA"
          strokeWidth="1.2"
        />
        <text
          x="50"
          y="16.5"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="800"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          V1
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u6-1-${uid}`}
          x1="6"
          y1="7"
          x2="28"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EFF6FF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient
          id={`u6-2-${uid}`}
          x1="38"
          y1="5"
          x2="62"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit7Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(37, 99, 235, 0.2))">
        <rect
          x="5"
          y="12"
          width="26"
          height="22"
          rx="5"
          fill={`url(#u7-1-${uid})`}
          stroke="#93C5FD"
          strokeWidth="1.2"
        />
        <text
          x="18"
          y="26"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#1D4ED8"
          fontFamily="sans-serif"
        >
          -ing
        </text>

        <rect
          x="37"
          y="12"
          width="26"
          height="22"
          rx="5"
          fill={`url(#u7-2-${uid})`}
          stroke="#60A5FA"
          strokeWidth="1.2"
        />
        <text
          x="50"
          y="26"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          to+V
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u7-1-${uid}`}
          x1="5"
          y1="12"
          x2="31"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EFF6FF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient
          id={`u7-2-${uid}`}
          x1="37"
          y1="12"
          x2="63"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit8Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(37, 99, 235, 0.2))">
        <rect
          x="5"
          y="8"
          width="58"
          height="30"
          rx="7"
          fill={`url(#u8-1-${uid})`}
          stroke="#93C5FD"
          strokeWidth="1.2"
        />

        <rect x="9" y="14" width="15" height="18" rx="3" fill="#DBEAFE" />
        <text
          x="16.5"
          y="25.5"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#1E40AF"
          fontFamily="sans-serif"
        >
          may
        </text>

        <rect x="26" y="14" width="16" height="18" rx="3" fill="#93C5FD" />
        <text
          x="34"
          y="25.5"
          textAnchor="middle"
          fontSize="6"
          fontWeight="900"
          fill="#1D4ED8"
          fontFamily="sans-serif"
        >
          could
        </text>

        <rect x="44" y="14" width="15" height="18" rx="3" fill="#2563EB" />
        <text
          x="51.5"
          y="25.5"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          must
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u8-1-${uid}`}
          x1="5"
          y1="8"
          x2="63"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#EFF6FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit9Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(124, 58, 237, 0.2))">
        <rect
          x="6"
          y="12"
          width="20"
          height="22"
          rx="5"
          fill={`url(#u9-1-${uid})`}
          stroke="#C4B5FD"
          strokeWidth="1.2"
        />
        <text
          x="16"
          y="26"
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#6D28D9"
          fontFamily="sans-serif"
        >
          A
        </text>

        <text
          x="34"
          y="27"
          textAnchor="middle"
          fontSize="12"
          fontWeight="900"
          fill="#8B5CF6"
          fontFamily="sans-serif"
        >
          =
        </text>

        <rect
          x="42"
          y="12"
          width="20"
          height="22"
          rx="5"
          fill={`url(#u9-2-${uid})`}
          stroke="#A78BFA"
          strokeWidth="1.2"
        />
        <text
          x="52"
          y="26"
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#5B21B6"
          fontFamily="sans-serif"
        >
          B
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u9-1-${uid}`}
          x1="6"
          y1="12"
          x2="26"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F5F3FF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
        <linearGradient
          id={`u9-2-${uid}`}
          x1="42"
          y1="12"
          x2="62"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EDE9FE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit10Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(2, 132, 199, 0.2))">
        <rect
          x="5"
          y="12"
          width="22"
          height="22"
          rx="5"
          fill={`url(#u10-1-${uid})`}
          stroke="#BAE6FD"
          strokeWidth="1.2"
        />
        <text
          x="16"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="900"
          fill="#0369A1"
          fontFamily="sans-serif"
        >
          if
        </text>

        <path
          d="M29 23H39M39 23L35 19M39 23L35 27"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="41"
          y="12"
          width="22"
          height="22"
          rx="5"
          fill={`url(#u10-2-${uid})`}
          stroke="#7DD3FC"
          strokeWidth="1.2"
        />
        <text
          x="52"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="900"
          fill="#0284C7"
          fontFamily="sans-serif"
        >
          then
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u10-1-${uid}`}
          x1="5"
          y1="12"
          x2="27"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0F9FF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
        <linearGradient
          id={`u10-2-${uid}`}
          x1="41"
          y1="12"
          x2="63"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit11Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(2, 132, 199, 0.2))">
        <rect
          x="5"
          y="8"
          width="58"
          height="30"
          rx="7"
          fill={`url(#u11-1-${uid})`}
          stroke="#7DD3FC"
          strokeWidth="1.2"
        />

        <rect x="9" y="14" width="16" height="18" rx="3" fill="#E0F2FE" />
        <text
          x="17"
          y="25.5"
          textAnchor="middle"
          fontSize="7"
          fontWeight="900"
          fill="#0369A1"
          fontFamily="sans-serif"
        >
          who
        </text>

        <rect x="27" y="14" width="18" height="18" rx="3" fill="#BAE6FD" />
        <text
          x="36"
          y="25.5"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#0284C7"
          fontFamily="sans-serif"
        >
          which
        </text>

        <rect x="47" y="14" width="12" height="18" rx="3" fill="#38BDF8" />
        <text
          x="53"
          y="25.5"
          textAnchor="middle"
          fontSize="7"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          that
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u11-1-${uid}`}
          x1="5"
          y1="8"
          x2="63"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0F9FF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit12Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(2, 132, 199, 0.2))">
        <rect
          x="6"
          y="12"
          width="22"
          height="22"
          rx="5"
          fill={`url(#u12-1-${uid})`}
          stroke="#7DD3FC"
          strokeWidth="1.2"
        />
        <text
          x="17"
          y="26"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fill="#0284C7"
          fontFamily="sans-serif"
        >
          If..
        </text>

        <path
          d="M30 23H38M38 23L34 19M38 23L34 27"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="40"
          y="12"
          width="22"
          height="22"
          rx="5"
          fill={`url(#u12-2-${uid})`}
          stroke="#38BDF8"
          strokeWidth="1.2"
        />
        <text
          x="51"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          Then
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u12-1-${uid}`}
          x1="6"
          y1="12"
          x2="28"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0F9FF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
        <linearGradient
          id={`u12-2-${uid}`}
          x1="40"
          y1="12"
          x2="62"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0284C7" />
          <stop offset="1" stopColor="#0369A1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit13Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(5, 150, 105, 0.2))">
        <rect
          x="6"
          y="6"
          width="56"
          height="34"
          rx="7"
          fill={`url(#u13-1-${uid})`}
          stroke="#A7F3D0"
          strokeWidth="1.2"
        />
        <rect x="13" y="22" width="10" height="12" rx="2" fill="#A7F3D0" />
        <rect x="29" y="14" width="10" height="20" rx="2" fill="#34D399" />
        <rect x="45" y="10" width="10" height="24" rx="2" fill="#059669" />
      </g>
      <defs>
        <linearGradient
          id={`u13-1-${uid}`}
          x1="6"
          y1="6"
          x2="62"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0FDF4" />
          <stop offset="1" stopColor="#DCFCE7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit14Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(37, 99, 235, 0.2))">
        <rect
          x="6"
          y="10"
          width="56"
          height="26"
          rx="7"
          fill={`url(#u14-1-${uid})`}
          stroke="#93C5FD"
          strokeWidth="1.2"
        />
        <rect x="11" y="15" width="46" height="16" rx="4" fill="#3B82F6" />
        <text
          x="34"
          y="26.5"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          be + V3
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u14-1-${uid}`}
          x1="6"
          y1="10"
          x2="62"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EFF6FF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit15Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(37, 99, 235, 0.2))">
        <path
          d="M12 10C12 7.8 13.8 6 16 6H52C54.2 6 56 7.8 56 10V26C56 28.2 54.2 30 52 30H28L18 36V30H16C13.8 30 12 28.2 12 26V10Z"
          fill={`url(#u15-1-${uid})`}
          stroke="#60A5FA"
          strokeWidth="1.2"
        />
        <text
          x="34"
          y="20.5"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#1D4ED8"
          fontFamily="sans-serif"
        >
          "said"
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u15-1-${uid}`}
          x1="12"
          y1="6"
          x2="56"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EFF6FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit16Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(2, 132, 199, 0.2))">
        <rect
          x="5"
          y="11"
          width="26"
          height="24"
          rx="5"
          fill={`url(#u16-1-${uid})`}
          stroke="#7DD3FC"
          strokeWidth="1.2"
        />
        <text
          x="18"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="900"
          fill="#0284C7"
          fontFamily="sans-serif"
        >
          V-ed
        </text>

        <rect
          x="37"
          y="11"
          width="26"
          height="24"
          rx="5"
          fill={`url(#u16-2-${uid})`}
          stroke="#38BDF8"
          strokeWidth="1.2"
        />
        <text
          x="50"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          V-ing
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u16-1-${uid}`}
          x1="5"
          y1="11"
          x2="31"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0F9FF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
        <linearGradient
          id={`u16-2-${uid}`}
          x1="37"
          y1="11"
          x2="63"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0284C7" />
          <stop offset="1" stopColor="#0369A1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit17Visual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(225, 29, 72, 0.2))">
        <rect
          x="5"
          y="8"
          width="58"
          height="30"
          rx="7"
          fill={`url(#u17-1-${uid})`}
          stroke="#F472B6"
          strokeWidth="1.2"
        />

        <rect x="9" y="14" width="22" height="18" rx="3" fill="#FFE4E6" />
        <text
          x="20"
          y="25.5"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#9D174D"
          fontFamily="sans-serif"
        >
          likely
        </text>

        <rect x="35" y="14" width="24" height="18" rx="3" fill="#FB7185" />
        <text
          x="47"
          y="25.5"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          tends
        </text>
      </g>
      <defs>
        <linearGradient
          id={`u17-1-${uid}`}
          x1="5"
          y1="8"
          x2="63"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFF1F2" />
          <stop offset="1" stopColor="#FFE4E6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Unit18Visual() {
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(124, 58, 237, 0.2))">
        <rect
          x="6"
          y="9"
          width="11"
          height="28"
          rx="3.5"
          fill="#F5F3FF"
          stroke="#DDD6FE"
          strokeWidth="1.2"
        />
        <text
          x="11.5"
          y="27"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="#6D28D9"
          fontFamily="sans-serif"
        >
          .
        </text>

        <rect
          x="20"
          y="9"
          width="11"
          height="28"
          rx="3.5"
          fill="#EDE9FE"
          stroke="#C4B5FD"
          strokeWidth="1.2"
        />
        <text
          x="25.5"
          y="27"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="#6D28D9"
          fontFamily="sans-serif"
        >
          ,
        </text>

        <rect
          x="34"
          y="9"
          width="11"
          height="28"
          rx="3.5"
          fill="#DDD6FE"
          stroke="#A78BFA"
          strokeWidth="1.2"
        />
        <text
          x="39.5"
          y="27"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="#5B21B6"
          fontFamily="sans-serif"
        >
          ;
        </text>

        <rect
          x="48"
          y="9"
          width="14"
          height="28"
          rx="3.5"
          fill="#8B5CF6"
          stroke="#7C3AED"
          strokeWidth="1.2"
        />
        <text
          x="55"
          y="26"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          '
        </text>
      </g>
    </svg>
  );
}

function FallbackWordFormsVisual() {
  const uid = useId();
  return (
    <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
      <g filter="drop-shadow(0px 4px 8px rgba(225, 29, 72, 0.2))">
        <rect
          x="8"
          y="12"
          width="24"
          height="22"
          rx="5"
          fill={`url(#pink-pill-1-${uid})`}
          stroke="#FBCFE8"
          strokeWidth="1.2"
        />
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="#9D174D"
          fontFamily="sans-serif"
        >
          noun
        </text>

        <path
          d="M33 23H39M39 23L35 19M39 23L35 27"
          stroke="#F43F5E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="41"
          y="12"
          width="22"
          height="22"
          rx="5"
          fill={`url(#pink-pill-2-${uid})`}
          stroke="#F472B6"
          strokeWidth="1.2"
        />
        <text
          x="52"
          y="26"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
          fill="#FFFFFF"
          fontFamily="sans-serif"
        >
          verb
        </text>
      </g>
      <defs>
        <linearGradient
          id={`pink-pill-1-${uid}`}
          x1="8"
          y1="12"
          x2="32"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFF1F2" />
          <stop offset="1" stopColor="#FFE4E6" />
        </linearGradient>
        <linearGradient
          id={`pink-pill-2-${uid}`}
          x1="41"
          y1="12"
          x2="63"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function SkillVisual({ skillCode, unitNumber, slug, compact = false }) {
  const containerClass = compact ? 'h-12 w-18 rounded-xl' : 'h-16 w-24 sm:w-28 rounded-2xl';

  const symbol = (() => {
    // 1. Precise mapping by Unit Number (1 to 18) or Slug
    const num = Number(unitNumber || 0);
    if (num === 1 || slug === 'complete-sentences-and-clauses') return <Unit1Visual />;
    if (num === 2 || slug === 'subject-verb-agreement') return <Unit2Visual />;
    if (num === 3 || slug === 'nouns-countability-and-quantity') return <Unit3Visual />;
    if (num === 4 || slug === 'articles-a-an-the-and-zero') return <Unit4Visual />;
    if (num === 5 || slug === 'pronouns-and-reference') return <Unit5Visual />;
    if (num === 6 || slug === 'essential-tense-control') return <Unit6Visual />;
    if (num === 7 || slug === 'gerunds-and-infinitives') return <Unit7Visual />;
    if (num === 8 || slug === 'modal-verbs-and-claim-strength') return <Unit8Visual />;
    if (num === 9 || slug === 'coordination-and-parallel-structure') return <Unit9Visual />;
    if (num === 10 || slug === 'subordination-and-logical-relationships') return <Unit10Visual />;
    if (num === 11 || slug === 'relative-clauses') return <Unit11Visual />;
    if (num === 12 || slug === 'conditionals') return <Unit12Visual />;
    if (num === 13 || slug === 'accurate-comparisons') return <Unit13Visual />;
    if (num === 14 || slug === 'passive-voice') return <Unit14Visual />;
    if (num === 15 || slug === 'reported-views-and-reporting-verbs') return <Unit15Visual />;
    if (num === 16 || slug === 'participle-clauses') return <Unit16Visual />;
    if (num === 17 || slug === 'hedging-and-precision') return <Unit17Visual />;
    if (num === 18 || slug === 'punctuation-for-grammar-accuracy') return <Unit18Visual />;

    // 2. Fallbacks by Skill Code
    if (skillCode === 'grammar_sentence_boundaries') return <Unit1Visual />;
    if (skillCode === 'grammar_verb_forms') return <Unit6Visual />;
    if (skillCode === 'grammar_agreement_number') return <Unit2Visual />;
    if (skillCode === 'grammar_articles_determiners') return <Unit4Visual />;
    if (skillCode === 'grammar_clause_control') return <Unit10Visual />;

    return <FallbackWordFormsVisual />;
  })();

  return (
    <div aria-hidden="true" className="relative shrink-0">
      <span
        className={cn(
          'relative flex items-center justify-center overflow-hidden bg-white/80 p-1 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10',
          containerClass
        )}
      >
        {symbol}
      </span>
    </div>
  );
}
