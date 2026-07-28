import { cn } from '@/lib/cn';

/**
 * Renders a decorative SVG illustration for a given grammar skill.
 * Extracted from GrammarDashboard to reduce its method size (was 164 LoC).
 */
export default function SkillVisual({ skillCode, compact = false }) {
  const containerClass = compact ? 'h-13 w-20 sm:w-22 rounded-xl' : 'h-16 w-24 sm:w-28 rounded-2xl';

  const symbol = (() => {
    if (skillCode === 'grammar_sentence_boundaries') {
      return (
        <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
          <g filter="drop-shadow(0px 4px 8px rgba(124, 58, 237, 0.2))">
            <rect
              x="6"
              y="9"
              width="25"
              height="29"
              rx="7"
              fill="url(#violet-card-1)"
              stroke="#C4B5FD"
              strokeWidth="1.5"
            />
            <circle cx="18.5" cy="23.5" r="3.5" fill="#6D28D9" />
            <rect
              x="36"
              y="5"
              width="27"
              height="34"
              rx="8"
              fill="url(#violet-card-2)"
              stroke="#A78BFA"
              strokeWidth="1.5"
            />
            <circle cx="49.5" cy="17.5" r="3" fill="#5B21B6" />
            <path
              d="M49.5 23.5C50.5 23.5 51.3 24.5 50.5 26.3C49.8 27.7 48.5 28.7 47.3 29.3"
              stroke="#5B21B6"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
          <defs>
            <linearGradient
              id="violet-card-1"
              x1="6"
              y1="9"
              x2="31"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F5F3FF" />
              <stop offset="1" stopColor="#DDD6FE" />
            </linearGradient>
            <linearGradient
              id="violet-card-2"
              x1="36"
              y1="5"
              x2="63"
              y2="39"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#EDE9FE" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    if (skillCode === 'grammar_verb_forms') {
      return (
        <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
          <g filter="drop-shadow(0px 4px 8px rgba(37, 99, 235, 0.2))">
            <path
              d="M6 34C18 34 22 28 34 28C46 28 50 34 62 34"
              stroke="#60A5FA"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="34" r="3.8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="34" cy="28" r="5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="2.2" />
            <circle cx="56" cy="34" r="3.8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <rect
              x="5"
              y="7"
              width="24"
              height="16"
              rx="5"
              fill="url(#blue-badge-1)"
              stroke="#93C5FD"
              strokeWidth="1.2"
            />
            <text
              x="17"
              y="18.5"
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="800"
              fill="#1E40AF"
              fontFamily="sans-serif"
            >
              -ed
            </text>
            <rect
              x="33"
              y="4"
              width="26"
              height="17"
              rx="5"
              fill="url(#blue-badge-2)"
              stroke="#60A5FA"
              strokeWidth="1.2"
            />
            <text
              x="46"
              y="16.5"
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#FFFFFF"
              fontFamily="sans-serif"
            >
              V1
            </text>
          </g>
          <defs>
            <linearGradient
              id="blue-badge-1"
              x1="5"
              y1="7"
              x2="29"
              y2="23"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#EFF6FF" />
              <stop offset="1" stopColor="#DBEAFE" />
            </linearGradient>
            <linearGradient
              id="blue-badge-2"
              x1="33"
              y1="4"
              x2="59"
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
    if (skillCode === 'grammar_agreement_number') {
      return (
        <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
          <g filter="drop-shadow(0px 4px 8px rgba(5, 150, 105, 0.2))">
            <rect
              x="4"
              y="5"
              width="31"
              height="16"
              rx="4.5"
              fill="url(#green-pill-1)"
              stroke="#A7F3D0"
              strokeWidth="1.2"
            />
            <text
              x="19.5"
              y="16.5"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              fill="#065F46"
              fontFamily="sans-serif"
            >
              They
            </text>
            <rect
              x="38"
              y="5"
              width="25"
              height="16"
              rx="4.5"
              fill="url(#green-pill-2)"
              stroke="#6EE7B7"
              strokeWidth="1.2"
            />
            <text
              x="50.5"
              y="16.5"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              fill="#047857"
              fontFamily="sans-serif"
            >
              are
            </text>
            <rect
              x="4"
              y="24"
              width="39"
              height="16"
              rx="4.5"
              fill="url(#green-pill-1)"
              stroke="#A7F3D0"
              strokeWidth="1.2"
            />
            <text
              x="23.5"
              y="35.5"
              textAnchor="middle"
              fontSize="9"
              fontWeight="800"
              fill="#065F46"
              fontFamily="sans-serif"
            >
              The team
            </text>
            <rect
              x="46"
              y="24"
              width="18"
              height="16"
              rx="4.5"
              fill="url(#green-pill-2)"
              stroke="#6EE7B7"
              strokeWidth="1.2"
            />
            <text
              x="55"
              y="35.5"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              fill="#047857"
              fontFamily="sans-serif"
            >
              is
            </text>
          </g>
          <defs>
            <linearGradient
              id="green-pill-1"
              x1="4"
              y1="5"
              x2="35"
              y2="21"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#ECFDF5" />
              <stop offset="1" stopColor="#D1FAE5" />
            </linearGradient>
            <linearGradient
              id="green-pill-2"
              x1="38"
              y1="5"
              x2="63"
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
    if (skillCode === 'grammar_articles_determiners') {
      return (
        <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
          <g filter="drop-shadow(0px 4px 8px rgba(217, 119, 6, 0.2))">
            <rect
              x="4"
              y="17"
              width="19"
              height="23"
              rx="5"
              fill="url(#amber-tile-1)"
              stroke="#FDE68A"
              strokeWidth="1.2"
            />
            <text
              x="13.5"
              y="33"
              textAnchor="middle"
              fontSize="12.5"
              fontWeight="800"
              fill="#B45309"
              fontFamily="sans-serif"
            >
              a
            </text>
            <rect
              x="22"
              y="5"
              width="22"
              height="23"
              rx="5"
              fill="url(#amber-tile-2)"
              stroke="#FCD34D"
              strokeWidth="1.2"
            />
            <text
              x="33"
              y="21"
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="800"
              fill="#92400E"
              fontFamily="sans-serif"
            >
              an
            </text>
            <rect
              x="38"
              y="17"
              width="27"
              height="23"
              rx="5"
              fill="url(#amber-tile-3)"
              stroke="#FBBF24"
              strokeWidth="1.2"
            />
            <text
              x="51.5"
              y="33"
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="800"
              fill="#78350F"
              fontFamily="sans-serif"
            >
              the
            </text>
          </g>
          <defs>
            <linearGradient
              id="amber-tile-1"
              x1="4"
              y1="17"
              x2="23"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFFBEB" />
              <stop offset="1" stopColor="#FDE68A" />
            </linearGradient>
            <linearGradient
              id="amber-tile-2"
              x1="22"
              y1="5"
              x2="44"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FEF3C7" />
              <stop offset="1" stopColor="#FCD34D" />
            </linearGradient>
            <linearGradient
              id="amber-tile-3"
              x1="38"
              y1="17"
              x2="65"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FDE68A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    if (skillCode === 'grammar_clause_control') {
      return (
        <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
          <g filter="drop-shadow(0px 4px 8px rgba(2, 132, 199, 0.2))">
            <path d="M16 23H52" stroke="#38BDF8" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="34" cy="23" r="5.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.2" />
            <rect
              x="5"
              y="10"
              width="21"
              height="26"
              rx="6"
              fill="url(#cyan-block-1)"
              stroke="#BAE6FD"
              strokeWidth="1.2"
            />
            <rect x="9.5" y="16.5" width="12" height="3.5" rx="1.75" fill="#0284C7" />
            <rect x="9.5" y="23" width="8" height="3.5" rx="1.75" fill="#38BDF8" />
            <rect
              x="42"
              y="10"
              width="21"
              height="26"
              rx="6"
              fill="url(#cyan-block-2)"
              stroke="#7DD3FC"
              strokeWidth="1.2"
            />
            <rect x="46.5" y="16.5" width="12" height="3.5" rx="1.75" fill="#0369A1" />
            <rect x="46.5" y="23" width="8" height="3.5" rx="1.75" fill="#0284C7" />
          </g>
          <defs>
            <linearGradient
              id="cyan-block-1"
              x1="5"
              y1="10"
              x2="26"
              y2="36"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F0F9FF" />
              <stop offset="1" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient
              id="cyan-block-2"
              x1="42"
              y1="10"
              x2="63"
              y2="36"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#BAE6FD" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    // default: grammar_word_forms
    return (
      <svg viewBox="0 0 68 46" className="h-full w-full" fill="none" aria-hidden="true">
        <g filter="drop-shadow(0px 4px 8px rgba(225, 29, 72, 0.2))">
          <rect
            x="15"
            y="4"
            width="36"
            height="16"
            rx="4.5"
            fill="url(#pink-pill-1)"
            stroke="#FBCFE8"
            strokeWidth="1.2"
          />
          <text
            x="33"
            y="15.5"
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill="#9D174D"
            fontFamily="sans-serif"
          >
            inform
          </text>
          <path
            d="M33 20V26M33 26L30 23M33 26L36 23"
            stroke="#F43F5E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="7"
            y="26"
            width="54"
            height="17"
            rx="5"
            fill="url(#pink-pill-2)"
            stroke="#F472B6"
            strokeWidth="1.2"
          />
          <text
            x="34"
            y="38"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="800"
            fill="#FFFFFF"
            fontFamily="sans-serif"
          >
            information
          </text>
        </g>
        <defs>
          <linearGradient
            id="pink-pill-1"
            x1="15"
            y1="4"
            x2="51"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFF1F2" />
            <stop offset="1" stopColor="#FFE4E6" />
          </linearGradient>
          <linearGradient
            id="pink-pill-2"
            x1="7"
            y1="26"
            x2="61"
            y2="43"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FB7185" />
            <stop offset="1" stopColor="#E11D48" />
          </linearGradient>
        </defs>
      </svg>
    );
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
