'use client';

import { usePortalStore } from "@stores";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import styles from "./ExperienceCursor.module.css";

const ExperienceCursor = () => {
  const activePortalId = usePortalStore((state) => state.activePortalId);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  // Removed unused scrollRotation state causing lint error
  const snowflakesRef = useRef<{ x: number; y: number; id: number; opacity: number; size: number; vx: number; vy: number }[]>([]);
  const [snowflakes, setSnowflakes] = useState<{ x: number; y: number; id: number; opacity: number; size: number; vx: number; vy: number }[]>([]);
  const nextSnowflakeId = useRef(0);

  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (activePortalId === 'projects') {
        // Add snowflake with random velocity for realistic drift
        const newSnowflake = {
          x: e.clientX,
          y: e.clientY,
          id: nextSnowflakeId.current++,
          opacity: 1,
          size: Math.random() * 6 + 2,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 + 2, // Drift downwards slightly
        };
        snowflakesRef.current.push(newSnowflake);
        if (snowflakesRef.current.length > 30) snowflakesRef.current.shift();
        setSnowflakes([...snowflakesRef.current]);
      }
    };

    const isPulsing = { current: false };
    const handleScroll = (e: WheelEvent) => {
      if (activePortalId === 'work') {
        let dy = e.deltaY;
        if (e.deltaMode === 1) dy *= 40;
        const rotationAmount = dy > 0 ? 20 : -20;

        const el = document.getElementById('work-gear');
        if (el) {
          gsap.to(el, {
            rotation: `+=${rotationAmount}`,
            duration: 0,
            overwrite: 'auto'
          });

          if (!isPulsing.current) {
            isPulsing.current = true;
            gsap.to(el, {
              scale: 1.2,
              duration: 0.1,
              yoyo: true,
              repeat: 1,
              ease: 'power1.out',
              onComplete: () => {
                isPulsing.current = false;
              }
            });
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleScroll, { passive: true });

    if (activePortalId) {
      document.body.style.cursor = 'none';
      const style = document.createElement('style');
      style.id = 'cursor-hide-style';
      style.innerHTML = `* { cursor: none !important; }`;
      document.head.appendChild(style);
    } else {
      document.body.style.cursor = 'auto';
      document.getElementById('cursor-hide-style')?.remove();
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleScroll);
      document.body.style.cursor = 'auto';
      document.getElementById('cursor-hide-style')?.remove();
    };
  }, [activePortalId]);

  // Fade out snowflakes using rAF for cross-browser performance
  useEffect(() => {
    if (isMobile || activePortalId !== 'projects') return;

    let lastTime = 0;
    let rafId: number;

    const animateSnowflakes = (time: number) => {
      if (time - lastTime > 30) {
        lastTime = time;
        snowflakesRef.current = snowflakesRef.current
          .map(s => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            opacity: s.opacity - 0.03
          }))
          .filter(s => s.opacity > 0);
        setSnowflakes([...snowflakesRef.current]);
      }
      rafId = requestAnimationFrame(animateSnowflakes);
    };

    rafId = requestAnimationFrame(animateSnowflakes);
    return () => cancelAnimationFrame(rafId);
  }, [activePortalId]);

  if (isMobile || !activePortalId) return null;

  return (
    <div
      className={styles.cursorWrapper}
      style={{ left: mousePos.x, top: mousePos.y }}
    >
      {activePortalId === 'literature' && (
        <div className={styles.magnifier}>
          <div className={styles.magnifierLens} />
        </div>
      )}

      {activePortalId === 'other-ventures' && (
        <div className={styles.star}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <div className={styles.sparkle} />
        </div>
      )}

      {activePortalId === 'projects' && (
        <div className={styles.comet}>
          <div className={styles.cometHead} />
          {snowflakes.map((s) => (
            <div
              key={s.id}
              className={styles.snowflake}
              style={{
                left: s.x - mousePos.x,
                top: s.y - mousePos.y,
                opacity: s.opacity,
                width: s.size,
                height: s.size,
              }}
            />
          ))}
        </div>
      )}

      {activePortalId === 'work' && (
        <div
          id="work-gear"
          className={styles.gear}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ExperienceCursor;
