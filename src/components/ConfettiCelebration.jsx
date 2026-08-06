import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const CELEBRATION_DURATION_MS = 4600;

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const THEMES = {
  gold: ['#FFD700', '#FDB931', '#FF9505', '#FFE135', '#D4AF37'],
  silver: ['#C0C0C0', '#D3D3D3', '#E5E4E2', '#A9A9A9', '#71706E'],
  bronze: ['#CD7F32', '#804A00', '#A57164', '#B08D57', '#8C7853'],
  // Neutral celebratory accents that stay legible over both light and dark surfaces.
  default: ['#F8FAFC', '#FBBF24', '#34D399', '#F472B6', '#38BDF8', '#FB7185'],
};

function createParticles(count, theme) {
  const palette = THEMES[theme] || THEMES.default;

  return Array.from({ length: count }, (_, id) => {
    const startX = randomBetween(5, 95);
    const shape =
      Math.random() > 0.4 ? 'rounded-full' : Math.random() > 0.5 ? 'rounded-sm' : 'rotate-45';

    return {
      id,
      color: palette[Math.floor(Math.random() * palette.length)],
      delay: randomBetween(0, 0.7),
      duration: randomBetween(2.2, 3.7),
      startX,
      endX: startX + randomBetween(-20, 20),
      rotation: randomBetween(360, 900),
      size: randomBetween(5, 10),
      shape,
    };
  });
}

const ConfettiParticle = ({ particle, theme = 'default' }) => {
  const { color, delay, duration, endX, rotation, shape, size, startX } = particle;

  return (
    <motion.div
      className={`absolute ${shape === 'rotate-45' ? 'rounded-none' : shape}`}
      style={{
        width: size,
        height: shape === 'rounded-full' ? size : size * 1.5,
        backgroundColor: color,
        left: `${startX}%`,
        top: '-5%',
        transform: shape === 'rotate-45' ? 'rotate(45deg)' : 'none',
        boxShadow: theme === 'gold' ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none',
      }}
      initial={{ y: 0, x: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: ['0vh', '100vh'],
        x: [0, endX - startX],
        opacity: [1, 1, 0.8, 0],
        rotate: rotation,
        scale: [1, 1.1, 0.7],
      }}
      transition={{
        duration,
        delay: delay,
        ease: 'easeOut',
      }}
      data-oid="qo0xka2"
    />
  );
};

export default function ConfettiCelebration({
  show,
  onComplete,
  particleCount = 50,
  theme = 'default',
}) {
  const [particles, setParticles] = useState([]);
  const onCompleteRef = useRef(onComplete);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!show) {
      setParticles([]);
      return undefined;
    }

    if (shouldReduceMotion || particleCount <= 0) {
      onCompleteRef.current?.();
      return undefined;
    }

    setParticles(createParticles(particleCount, theme));
    const timer = window.setTimeout(() => {
      setParticles([]);
      onCompleteRef.current?.();
    }, CELEBRATION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [show, particleCount, theme, shouldReduceMotion]);

  return (
    <AnimatePresence data-oid="j7tlwaj">
      {show && particles.length > 0 && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-200 overflow-hidden"
          data-testid="confetti-celebration"
          data-oid="7f_0xgu"
        >
          {particles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              particle={particle}
              theme={theme}
              data-oid="8wveq_p"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
