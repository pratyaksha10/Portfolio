import { ScrollControls, Scroll, useScroll, useVideoTexture } from "@react-three/drei";
import { usePortalStore, useScrollStore } from "@stores";
import { useEffect, useRef, Suspense } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import Hero from "./Hero";

import ButterflyModel from "../../models/Butterfly";

const VideoBackground = () => {
  const texture = useVideoTexture("https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4", { muted: true, loop: true, start: true });
  return (
    <mesh position={[0, 0, -3.81]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
};

const LiteratureInnerScroll = ({ handleScroll, isActive }: { handleScroll: (e: Event) => void, isActive: boolean }) => {
  const data = useScroll();
  const wasActive = useRef(false);

  useEffect(() => {
    if (isActive) {
      wasActive.current = true;
      data.el.addEventListener('scroll', handleScroll);
      data.el.style.zIndex = '1';
    } else if (wasActive.current) {
      wasActive.current = false;
      data.el.scrollTo({ top: 0, behavior: 'smooth' });
      data.el.removeEventListener('scroll', handleScroll);
      data.el.style.zIndex = '-1';
    }
  }, [isActive, data.el, handleScroll]);

  return null;
};

const LiteratureThumbnail = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle float animation for the overall group
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <ButterflyModel index={1} boundsWidth={1.8} boundsHeight={1.8} scale={1.25} contrastMult={2.8} />
      <ButterflyModel index={3} boundsWidth={1.8} boundsHeight={1.8} scale={1.1} contrastMult={2.8} />
      <ButterflyModel index={5} boundsWidth={1.8} boundsHeight={1.8} scale={1.18} contrastMult={2.8} />
      <ButterflyModel index={7} boundsWidth={1.8} boundsHeight={1.8} scale={1.5} contrastMult={2.8} />
    </group>
  );
};



const Literature = () => {
  const activePortalId = usePortalStore((state) => state.activePortalId);
  const isActive = activePortalId === 'literature';
  const anyActive = !!activePortalId;
  const { setScrollProgress } = useScrollStore();

  const mainData = useScroll();
  const wasActive = useRef(false);

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
    setScrollProgress(progress);
  }

  const { camera } = useThree();

  useEffect(() => {
    const originalScrollWrapper = mainData.el;

    if (isActive) {
      wasActive.current = true;
      setScrollProgress(0);
      if (originalScrollWrapper) originalScrollWrapper.style.zIndex = '-1';

      if (isMobile) {
        gsap.to(camera.position, { z: 11.5, y: -43, x: -1, duration: 1.2, ease: 'power3.inOut' });
      } else {
        gsap.to(camera.position, { y: -43, x: -2, duration: 1.2, ease: 'power3.inOut' });
      }
    } else if (wasActive.current) {
      wasActive.current = false;
      setScrollProgress(0);
      if (originalScrollWrapper) originalScrollWrapper.style.zIndex = '1';
    }
  }, [isActive, mainData.el, setScrollProgress, camera.position]);

  return (
    <group>

      <mesh receiveShadow>
        <planeGeometry args={[2.8, 2.8, 1]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
      <Suspense fallback={null}>
        <VideoBackground />
      </Suspense>
      {!anyActive && <LiteratureThumbnail />}
      <ScrollControls style={{ zIndex: -1 }} pages={2} maxSpeed={0.4}>
        <LiteratureInnerScroll handleScroll={handleScroll} isActive={isActive} />
        <Scroll html style={{
          width: '100vw',
          height: '100vh',
          opacity: isActive ? 1 : 0,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 1.2s ease-in-out'
        }}>
          <Hero isActive={isActive} />
        </Scroll>
      </ScrollControls>
    </group>
  );
};

export default Literature;