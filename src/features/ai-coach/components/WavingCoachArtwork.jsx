/** Separate transparent layers let Ava wave without cutting through her fingers. */
export default function WavingCoachArtwork({ hero = false, className = 'h-full w-full' }) {
  const size = hero ? 512 : 168;
  const variant = hero ? 'hero' : 'small';

  return (
    <span className={`relative block overflow-visible ${className}`} aria-hidden="true">
      <img
        src={`/assets/ai-coach/ava-arm-${variant}.webp`}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable="false"
        className="ask-ai-coach-avatar__hand absolute inset-0 h-full w-full object-contain"
      />
      <img
        src={`/assets/ai-coach/ava-base-${variant}.webp`}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable="false"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <img
        src={`/assets/ai-coach/ava-blink-${variant}.webp`}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable="false"
        className="ask-ai-coach-avatar__blink absolute inset-0 h-full w-full object-contain"
      />
    </span>
  );
}
