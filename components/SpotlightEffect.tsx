'use client';

import { useEffect, useCallback } from 'react';

export default function SpotlightEffect() {
  const handleMouseMove = useCallback((e: MouseEvent) => {
    document.documentElement.style.setProperty(
      '--spotlight-x',
      `${e.clientX}px`
    );
    document.documentElement.style.setProperty(
      '--spotlight-y',
      `${e.clientY}px`
    );
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 lg:absolute"
      style={{
        background:
          'radial-gradient(600px at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(29, 78, 216, 0.15), transparent 80%)',
      }}
      aria-hidden="true"
    />
  );
}
