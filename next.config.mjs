import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

/** @type {(phase: string) => import('next').NextConfig} */
export default (phase) => ({
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
  // With output: 'export', distDir is the export folder. Production builds go to dist/, never the dev server's .next/.
  distDir: phase === PHASE_PRODUCTION_BUILD ? 'dist' : '.next',
});
