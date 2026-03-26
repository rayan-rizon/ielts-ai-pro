import React, { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';

const AudioVisualizer = ({ stream, isListening, isRecording }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!isListening || !stream) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, isRecording ? '#3b82f6' : '#94a3b8'); // Blue or Slate
        gradient.addColorStop(1, isRecording ? '#8b5cf6' : '#cbd5e1'); // Purple or Light Slate

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        // Verify state before closing to avoid warnings
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(console.error);
        }
        audioContextRef.current = null;
      }
    };
  }, [isListening, stream, isRecording]);

  return (
    <div
      className="w-full h-24 bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden relative"
      data-oid="7qym7p8"
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={96}
        className="w-full h-full"
        data-oid="klpkrg0"
      />

      {!isListening && (
        <div
          className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm"
          data-oid="ebw3fxq"
        >
          Microphone off
        </div>
      )}
    </div>
  );
};

AudioVisualizer.displayName = 'AudioVisualizer';

export default memo(AudioVisualizer);
