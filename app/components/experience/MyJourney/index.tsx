import { Scroll, ScrollControls, useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import React, { useEffect, useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import { usePortalStore } from "@stores";
import { Wanderer } from "../../models/Wanderer";
import Carousel from "./Carousel";
const MyJourneyInnerScroll = ({ isActive }: { isActive: boolean }) => {
  const { camera } = useThree();
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const targetProgress = useRef(0.5); // Start centered
  const smoothProgress = useRef(0.5);
  const rafRef = useRef<number>(0);
  const touchStartX = useRef(0);
  const startProgress = useRef(0.5);
  const data = useScroll();
  const wasActive = useRef(false);

  useEffect(() => {
    if (isActive) {
      wasActive.current = true;
      if (data && data.el) {
        data.el.style.zIndex = '1';
      }
    } else if (wasActive.current) {
      wasActive.current = false;
      if (data && data.el) {
        data.el.style.zIndex = '-1';
      }
    }
  }, [isActive, data]);

  useEffect(() => {
    if (!isActive || !isMobile) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      startProgress.current = targetProgress.current;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const deltaX = touchStartX.current - e.touches[0].clientX;
      const progressDelta = deltaX / window.innerWidth;
      targetProgress.current = Math.max(0, Math.min(1, startProgress.current + progressDelta * 1.5));
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    targetProgress.current = 0.8;
    smoothProgress.current = 0.8;

    const tick = () => {
      smoothProgress.current += (targetProgress.current - smoothProgress.current) * 0.1;

      if (thumbRef.current) {
        thumbRef.current.style.transform = `translateX(${smoothProgress.current * 400}%)`;
      }

      if (isMobile) {
        const maxRotation = Math.PI / 3;
        // Map 0 -> maxRotation (left), 1 -> -maxRotation (right)
        camera.rotation.y = THREE.MathUtils.lerp(maxRotation, -maxRotation, smoothProgress.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, camera]);

  const handleTrackInteraction = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    targetProgress.current = x / rect.width;
  };

  return (
    <Scroll html style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}>
      {isActive && isMobile && (
        <div 
          ref={trackRef}
          className="fixed bottom-[15vh] left-1/2 -translate-x-1/2 w-[70vw] h-10 pointer-events-auto cursor-pointer flex flex-col items-center justify-center z-[9999]"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTrackInteraction}
          onTouchMove={handleTrackInteraction}
          onMouseDown={handleTrackInteraction}
          onMouseMove={(e) => { if (e.buttons === 1) handleTrackInteraction(e); }}
        >
          <div className="h-2.5 w-full bg-white/20 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/30 backdrop-blur-xl relative">
            <div 
              ref={thumbRef}
              className="h-full bg-white rounded-full absolute top-0 left-0 shadow-[0_0_15px_rgba(255,255,255,0.5)] pointer-events-none z-10"
              style={{ width: '20%' }}
            />
          </div>
        </div>
      )}
    </Scroll>
  );
};

const MyJourney = () => {
  const { camera } = useThree();
  const isActive = usePortalStore((state) => state.activePortalId === "projects");
  const data = useScroll();

  useEffect(() => {
    // Hide scrollbar when active.
    data.el.style.overflow = isActive ? 'hidden' : 'auto';
    if (isActive) {
      if (isMobile) {
        gsap.to(camera.position, { z: 11.5, y: -39, x: 1, duration: 1.2, ease: 'power3.inOut' });
      } else {
        gsap.to(camera.position, { y: -39, x: 2, duration: 1.2, ease: 'power3.inOut' });
      }
    }
  }, [isActive, camera.position]);

  useFrame((state, delta) => {
    if (isActive) {
      if (!isMobile) {
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -(state.pointer.x * Math.PI) / 4, 0.03);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 11.5 - state.pointer.y, 7, delta);
      }
    }
  });

  return (
    <group>
      <Wanderer rotation={new THREE.Euler(0, Math.PI / 6, 0)} scale={new THREE.Vector3(1.5, 1.5, 1.5)} position={new THREE.Vector3(0, -1, -1)} />
      <Carousel />
      <ScrollControls style={{ zIndex: -1 }} pages={1} maxSpeed={0}>
        <MyJourneyInnerScroll isActive={isActive} />
      </ScrollControls>
    </group>
  );
};

export default MyJourney;
