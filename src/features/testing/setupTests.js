/* global process */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextType) {
    if (contextType === '2d') {
      return {
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        scale: () => {},
      };
    }
    return null;
  };
}
