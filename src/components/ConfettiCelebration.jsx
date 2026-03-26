import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PARTICLE_COUNT = 50;

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const THEMES = {
  gold: ['#FFD700', '#FDB931', '#FF9505', '#FFE135', '#D4AF37'],
  silver: ['#C0C0C0', '#D3D3D3', '#E5E4E2', '#A9A9A9', '#71706E'],
  bronze: ['#CD7F32', '#804A00', '#A57164', '#B08D57', '#8C7853'],
  default: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
};

const ConfettiParticle = ({ delay, theme = 'default' }) => {
  const palette = THEMES[theme] || THEMES.default;
  const color = palette[Math.floor(Math.random() * palette.length)];
  const startX = randomBetween(5, 95);
  const endX = startX + randomBetween(-20, 20);
  const rotation = randomBetween(0, 720);
  const size = randomBetween(6, 12);
  const shape =
    Math.random() > 0.4 ? 'rounded-full' : Math.random() > 0.5 ? 'rounded-sm' : 'rotate-45';

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
        y: [0, randomBetween(window.innerHeight * 0.4, window.innerHeight * 0.9)],
        x: [0, endX - startX],
        opacity: [1, 1, 0.8, 0],
        rotate: rotation,
        scale: [1, 1.1, 0.7],
      }}
      transition={{
        duration: randomBetween(2, 4),
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

  useEffect(() => {
    if (show) {
      setParticles(
        Array.from({ length: particleCount }, (_, i) => ({
          id: i,
          delay: randomBetween(0, 0.8),
        }))
      );

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete, particleCount]);

  return (
    <AnimatePresence data-oid="j7tlwaj">
      {show && particles.length > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-[200] overflow-hidden"
          data-oid="7f_0xgu"
        >
          {particles.map((p) => (
            <ConfettiParticle key={p.id} delay={p.delay} theme={theme} data-oid="8wveq_p" />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
