import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { isMobile } from "react-device-detect";
import { usePortalStore, useScrollStore } from "@stores";
import { useCallback, useEffect, useLayoutEffect, useRef, memo } from "react";
import * as THREE from "three";
import { Memory } from "../../models/Memory";
import Timeline from "./Timeline";

// Inner scroll: attaches smooth-scroll + gear rotation on wheel
const WorkInnerScroll = memo(({ handleScroll, isActive }: { handleScroll: (progress: number) => void, isActive: boolean }) => {
  const data = useScroll();
  const wasActive = useRef(false);
  const smoothProgress = useRef(0);
  const targetProgress = useRef(0);
  const rafRef = useRef<number>(0);
  const touchStartY = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Calculates scroll resistance (up to 90% slowdown) near timeline nodes
  const applyResistance = (delta: number, currentProgress: number) => {
    const segment = 0.25; // 5 nodes: 0, 0.25, 0.5, 0.75, 1.0
    const closestNodeProgress = Math.round(currentProgress / segment) * segment;
    const distance = Math.abs(currentProgress - closestNodeProgress);

    if (distance < 0.05) {
      // Max slowdown (10% speed) at distance 0, returning to 100% speed at distance 0.05
      const multiplier = 0.1 + (distance / 0.05) * 0.9;
      return delta * multiplier;
    }
    return delta;
  };

  // Smooth scroll loop using rAF interpolation
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      // Lerp towards target — easing factor controls speed (lower = slower)
      smoothProgress.current += (targetProgress.current - smoothProgress.current) * 0.655;

      // Sync the scroll element so ScrollControls picks it up
      const maxScroll = Math.max(1, data.el.scrollHeight - data.el.clientHeight);
      const desiredTop = smoothProgress.current * maxScroll;
      data.el.scrollTop = desiredTop;

      const clamped = Math.min(Math.max(smoothProgress.current, 0), 1);
      handleScroll(clamped);

      if (thumbRef.current) {
        thumbRef.current.style.transform = `translateY(${clamped * 400}%)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, data.el, handleScroll]);

  // Wheel → update targetProgress (no native scroll)
  useEffect(() => {
    if (!isActive) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const maxScroll = Math.max(1, data.el.scrollHeight - data.el.clientHeight);

      // Normalize deltaY (Firefox uses deltaMode 1 for lines, Chrome uses pixels)
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 40; // 40px per line approximation

      // Sensitivity: divide delta by a larger number to slow down
      const rawDelta = dy / (maxScroll * 2.78);
      const delta = applyResistance(rawDelta, targetProgress.current);
      targetProgress.current = Math.min(Math.max(targetProgress.current + delta, 0), 1);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isActive, data.el]);

  // Touch → update targetProgress (mirrors the wheel handler for mobile)
  useEffect(() => {
    if (!isActive) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = touchStartY.current - e.touches[0].clientY;
      touchStartY.current = e.touches[0].clientY;
      const maxScroll = Math.max(1, data.el.scrollHeight - data.el.clientHeight);
      // Significantly higher sensitivity for faster scrolling on mobile
      const rawDelta = deltaY / (maxScroll * 0.21);
      const delta = applyResistance(rawDelta, targetProgress.current);
      targetProgress.current = Math.min(Math.max(targetProgress.current + delta, 0), 1);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [isActive, data.el]);

  useEffect(() => {
    if (isActive) {
      wasActive.current = true;
      data.el.style.zIndex = '1';
      // Reset smooth progress on entry
      smoothProgress.current = 0;
      targetProgress.current = 0;
    } else if (wasActive.current) {
      wasActive.current = false;
      cancelAnimationFrame(rafRef.current);
      data.el.scrollTo({ top: 0, behavior: 'instant' });
      data.el.style.zIndex = '-1';
    }
  }, [isActive, data.el]);

  const handleTrackInteraction = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    // The thumb is 20% height, so the max center is between 10% and 90%
    targetProgress.current = y / rect.height;
  };

  return (
    <Scroll html style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}>
      {isActive && isMobile && (
        <div
          ref={trackRef}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-[40vh] bg-white/10 rounded-full pointer-events-auto shadow-xl border border-white/20 backdrop-blur-md cursor-pointer"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTrackInteraction}
          onTouchMove={handleTrackInteraction}
          onMouseDown={handleTrackInteraction}
          onMouseMove={(e) => { if (e.buttons === 1) handleTrackInteraction(e); }}
        >
          <div
            ref={thumbRef}
            className="w-full bg-white rounded-full absolute top-0 left-0 shadow-lg pointer-events-none z-10"
            style={{ height: '20%' }}
          />
        </div>
      )}
    </Scroll>
  );
});

WorkInnerScroll.displayName = 'WorkInnerScroll';

const Work = () => {
  const isActive = usePortalStore((state) => state.activePortalId === 'work');
  const { scrollProgress, setScrollProgress } = useScrollStore();
  const mainData = useScroll();
  const wasActive = useRef(false);
  const { camera } = useThree();

  // Stable callback — does NOT recreate on every render
  const handleScroll = useCallback((progress: number) => {
    setScrollProgress(progress);
  }, [setScrollProgress]);

  // useLayoutEffect avoids a paint before GSAP fires, reducing entry lag
  useLayoutEffect(() => {
    const originalScrollWrapper = mainData.el;

    if (isActive) {
      wasActive.current = true;
      setScrollProgress(0);
      if (originalScrollWrapper) originalScrollWrapper.style.zIndex = '-1';

      // Defer heavy camera animation until after paint
      requestAnimationFrame(() => {
        if (isMobile) {
          gsap.to(camera.position, { z: 13, y: -39, x: 0, duration: 1.2, ease: 'power3.inOut' });
        } else {
          gsap.to(camera.position, { z: 13, y: -39, x: -2, duration: 1.2, ease: 'power3.inOut' });
        }
      });
    } else if (wasActive.current) {
      wasActive.current = false;
      setScrollProgress(0);
      if (originalScrollWrapper) originalScrollWrapper.style.zIndex = '1';
    }
  }, [isActive]);

  return (
    <group>
      <mesh receiveShadow>
        <planeGeometry args={[4, 4, 1]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
      {/* maxSpeed lowered to 0.05 for slower base scroll */}
      <ScrollControls style={{ zIndex: -1 }} pages={isMobile ? 10 : 3} maxSpeed={0}>
        <WorkInnerScroll handleScroll={handleScroll} isActive={isActive} />

        <Memory scale={new THREE.Vector3(5, 5, 5)} position={new THREE.Vector3(0, -6, 1)} />
        <Timeline progress={isActive ? scrollProgress : 0} />
      </ScrollControls>
    </group>
  );
};

export default Work;
