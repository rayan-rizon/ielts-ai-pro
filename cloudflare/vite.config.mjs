import { mergeConfig } from 'vite';
import base from '../vite.config.js';
import { buildOutput } from './profile.mjs';

export default mergeConfig(base, {
  build: { outDir: buildOutput(process.env.CF_BUILD_PROFILE), emptyOutDir: true },
});
