'use client';

import dynamic from 'next/dynamic';
import { isMobile } from 'react-device-detect';

// ssr:false is only valid inside a Client Component — this wrapper enables that.
const FluidCursorTrail = dynamic(
  () => import('./FluidCursorTrail'),
  { ssr: false }
);

export default function FluidCursorTrailWrapper() {
  // The fluid trail is mouse-driven only — skip the heavy WebGL simulation on touch devices.
  if (isMobile) return null;
  return <FluidCursorTrail />;
}
