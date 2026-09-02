import React from 'react';

export function HeaderWaveBackground() {
  return (
    <svg
      className="pointer-events-none absolute right-0 top-0 h-full w-full max-w-[650px] opacity-90"
      viewBox="0 0 650 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M 150 -40 Q 320 40 400 140 T 650 200"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.22"
        fill="none"
      />
      <path
        d="M 180 -50 Q 350 30 430 130 T 680 190"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.18"
        fill="none"
      />
      <path
        d="M 210 -60 Q 380 20 460 120 T 710 180"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.15"
        fill="none"
      />
      <path
        d="M 240 -70 Q 410 10 490 110 T 740 170"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.12"
        fill="none"
      />
      <path
        d="M 270 -80 Q 440 0 520 100 T 770 160"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.09"
        fill="none"
      />

      <path
        d="M 220 240 Q 380 160 480 80 T 680 -20"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0.14"
        fill="none"
      />
      <path
        d="M 250 250 Q 410 170 510 90 T 710 -10"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0.10"
        fill="none"
      />
    </svg>
  );
}

export function SpeechBubbleGraphic() {
  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="160"
        height="125"
        viewBox="0 0 220 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_12px_18px_rgba(159,18,57,0.3)] transition-transform duration-500 hover:scale-105"
      >
        <defs>
          <linearGradient
            id="bubbleBodyGrad"
            x1="30"
            y1="20"
            x2="170"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFF1F3" />
            <stop offset="100%" stopColor="#FECDD3" />
          </linearGradient>

          <linearGradient
            id="bubbleHighlight"
            x1="100"
            y1="20"
            x2="100"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="dotGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="50%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="10"
              floodColor="#881337"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        {/* 4-Point Sparkle Star */}
        <g transform="translate(18, 38)">
          <path
            d="M 12 0 C 12 6.6 6.6 12 0 12 C 6.6 12 12 17.4 12 24 C 12 17.4 17.4 12 24 12 C 17.4 12 12 6.6 12 0 Z"
            fill="white"
            opacity="0.95"
            className="animate-pulse"
          />
        </g>

        {/* Dot Grid Matrix (5x3) */}
        <g opacity="0.4" transform="translate(15, 105)">
          {[0, 12, 24, 36, 48].map((x) =>
            [0, 12, 24].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="white" />)
          )}
        </g>

        {/* Main 3D Speech Bubble */}
        <g filter="url(#softShadow)" transform="rotate(-2 125 85)">
          <path
            d="M 70 25 
               C 125 25, 175 25, 175 75 
               C 175 115, 140 125, 110 125 
               C 95 125, 80 132, 68 145 
               C 66 147, 63 145, 64 142 
               C 66 135, 68 127, 66 122 
               C 45 115, 35 98, 35 75 
               C 35 25, 70 25, 70 25 Z"
            fill="url(#bubbleBodyGrad)"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="2.5"
          />

          <path
            d="M 50 55 C 50 35, 75 28, 115 28 C 150 28, 165 38, 165 55"
            stroke="url(#bubbleHighlight)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />

          {/* 3 Red Speech Dots */}
          <circle cx="82" cy="72" r="8.5" fill="url(#dotGrad)" />
          <circle cx="106" cy="72" r="8.5" fill="url(#dotGrad)" />
          <circle cx="130" cy="72" r="8.5" fill="url(#dotGrad)" />
        </g>
      </svg>
    </div>
  );
}
