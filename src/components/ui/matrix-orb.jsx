import React, { useEffect, useRef, useSyncExternalStore } from 'react';

import { cn } from '@/lib/cn';

const TAU = Math.PI * 2;
const STATES = ['idle', 'listening', 'thinking'];

const LABELS = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
};

const SCALE = {
  idle: 0.88,
  listening: 1,
  thinking: 0.92,
};

const STIFFNESS = 180;
const DAMPING = 26;
const ATTACK = 0.22;
const RELEASE = 0.08;
const BLEND = 0.16;

const ORBITERS = [
  { radius: 0.62, speed: 2.2, phase: 0, spread: 0.42 },
  { radius: 0.4, speed: -1.7, phase: 2.1, spread: 0.36 },
  { radius: 0.8, speed: 1.15, phase: 4, spread: 0.34 },
];

// no Math.abs here, its corners read as a snap at every trough
function envelope(t) {
  const slow = 0.5 + 0.5 * Math.sin(t * 0.62 + 0.4);
  const fast = 0.5 + 0.5 * Math.sin(t * 1.9 + 1.1);
  return 0.22 + 0.78 * (0.45 + 0.55 * slow) * fast;
}

function intensityOf(state, d, nx, ny, t, amplitude) {
  if (state === 'listening') {
    const ripple = 0.5 + 0.5 * Math.sin(d * 5.2 - t * 4.5);
    const voicePulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    return 0.28 + amplitude * (0.35 + 0.45 * ripple) + 0.16 * voicePulse * Math.exp(-d * 2.2);
  }

  if (state === 'thinking') {
    let heat = 0;
    for (const o of ORBITERS) {
      const a = t * o.speed + o.phase;
      const dx = nx - Math.cos(a) * o.radius;
      const dy = ny - Math.sin(a) * o.radius;
      heat += Math.exp(-(dx * dx + dy * dy) / (o.spread * o.spread));
    }
    return 0.22 + 0.85 * Math.min(1, heat);
  }

  // Idle: Dynamic living spherical wave with rotating vortex and orbital spot
  const angle = Math.atan2(ny, nx);
  const swirl1 = Math.sin(angle * 2 + t * 2.2 - d * 2.8);
  const swirl2 = Math.cos(angle * 3 - t * 1.8 + d * 3.2);
  const coreBreathe = 0.5 + 0.5 * Math.sin(t * 1.8);
  const core = Math.exp(-d * d * 3.0) * coreBreathe * 0.35;
  const orbitAngle = t * 1.4;
  const odx = nx - Math.cos(orbitAngle) * 0.52;
  const ody = ny - Math.sin(orbitAngle) * 0.52;
  const spot = Math.exp(-(odx * odx + ody * ody) / 0.22) * 0.45;

  const combined = 0.3 + 0.35 * (swirl1 * 0.5 + swirl2 * 0.5 + 1) + core + spot;
  return Math.min(1, Math.max(0.18, combined));
}

function subscribeToZoom(onChange) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

// zoom changes devicePixelRatio, and a buffer built for the old one gets upscaled
function useDevicePixelRatio() {
  return useSyncExternalStore(
    subscribeToZoom,
    () => Math.min(window.devicePixelRatio || 1, 4),
    () => 1
  );
}

const MatrixOrb = ({
  state = 'idle',
  level,
  size = 240,
  color = '#F75001',
  dots = 11,
  labels,
  showLabel = true,
  paused = false,
  forceAnimate = true,
  reducedMotion = false,
  canvasClassName,
  className,
  ...props
}) => {
  const canvasRef = useRef(null);
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  const redrawRef = useRef(null);
  const dpr = useDevicePixelRatio();

  useEffect(() => {
    stateRef.current = state;
    levelRef.current = level;
  }, [state, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // scaling by buffer/size, not dpr, keeps the transform exact when it rounds
    const buffer = Math.round(size * dpr);
    canvas.width = canvas.height = buffer;
    ctx.scale(buffer / size, buffer / size);

    const resolveColor = () => {
      if (color && color !== 'currentColor' && !color.startsWith('var(')) {
        return color;
      }
      if (canvas && typeof window !== 'undefined') {
        const computed = window.getComputedStyle(canvas).color;
        if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent') {
          return computed;
        }
      }
      return '#5a63df';
    };

    ctx.fillStyle = resolveColor();

    const grid = Math.max(3, Math.round(dots));
    const half = (grid - 1) / 2;
    const spacing = (size * 0.74) / (grid - 1);
    const maxRadius = spacing * 0.6;
    const center = size / 2;

    const weights = { idle: 0, listening: 0, thinking: 0 };
    weights[stateRef.current] = 1;

    // a non-finite level would stick in the smoother forever
    const levelAt = (t) => {
      const v = levelRef.current;
      return v === undefined || !Number.isFinite(v) ? envelope(t) : Math.min(1, Math.max(0, v));
    };

    const draw = (t, amplitude, scale) => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = resolveColor();

      for (let iy = 0; iy < grid; iy++) {
        for (let ix = 0; ix < grid; ix++) {
          const nx = (ix - half) / half;
          const ny = (iy - half) / half;
          const d = Math.hypot(nx, ny);
          // 1.12, not the square's 1.41 corner, is what makes the outline round
          if (d > 1.12) continue;

          let blended = 0;
          for (const s of STATES) {
            if (weights[s] < 0.001) continue;
            blended += weights[s] * intensityOf(s, d, nx, ny, t, amplitude);
          }

          const intensity = Math.min(1, Math.max(0, blended));
          const radius = maxRadius * Math.exp(-d * d * 1.7) * intensity * scale;
          // anything under half a device pixel renders as haze, not a dot
          if (radius * dpr < 0.5) continue;

          // Subtle organic spherical displacement
          const wavePhase = t * 2.2 + nx * 2.5 + ny * 2.5;
          const displace = Math.sin(wavePhase) * (spacing * 0.06) * (1 - d * 0.35);
          const px = center + (ix - half) * spacing * scale + nx * displace;
          const py = center + (iy - half) * spacing * scale + ny * displace;

          ctx.globalAlpha = Math.min(1, Math.max(0.35, 0.4 + 0.6 * intensity));
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const reduce =
      !forceAnimate &&
      (reducedMotion ||
        (typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches));

    if (reduce || paused) {
      redrawRef.current = () => {
        const current = stateRef.current;
        for (const s of STATES) weights[s] = s === current ? 1 : 0;
        draw(0, levelAt(0), SCALE[current]);
      };
      redrawRef.current();
      return () => {
        redrawRef.current = null;
      };
    }

    let t = 0;
    let amplitude = 0;
    let scale = SCALE[stateRef.current];
    let velocity = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      const current = stateRef.current;
      const target = levelAt(t);
      const rate = target > amplitude ? ATTACK : RELEASE;
      amplitude += (target - amplitude) * (1 - Math.pow(1 - rate, dt * 60));

      // per-state weights, so interrupting a change blends from what is on screen
      const step = 1 - Math.pow(1 - BLEND, dt * 60);
      for (const s of STATES) {
        weights[s] += ((s === current ? 1 : 0) - weights[s]) * step;
      }

      velocity += (-STIFFNESS * (scale - SCALE[current]) - DAMPING * velocity) * dt;
      scale += velocity * dt;

      draw(t, amplitude, scale);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
    // state stays out of the deps on purpose: the loop retargets, it never restarts
  }, [size, color, dots, dpr, paused, forceAnimate, reducedMotion]);

  useEffect(() => {
    redrawRef.current?.();
  }, [state, level]);

  return (
    <div
      data-slot="matrix-orb"
      data-state={state}
      className={cn('flex flex-col items-center gap-3', className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn('block max-w-full max-h-full aspect-square', canvasClassName)}
        style={{ width: size, height: size }}
      />
      {showLabel && labels !== false && (
        <span role="status" aria-live="polite" className="text-sm text-foreground/70">
          {labels?.[state] ?? LABELS[state]}
        </span>
      )}
    </div>
  );
};

export default MatrixOrb;
