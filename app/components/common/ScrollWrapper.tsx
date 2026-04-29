'use client';

import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

import { usePortalStore, useScrollStore } from "@stores";

const ScrollWrapper = (props: { children: React.ReactNode | React.ReactNode[] }) => {
  const { camera } = useThree();
  const data = useScroll();
  const isActive = usePortalStore((state) => !!state.activePortalId);
  const lastActivePortalId = usePortalStore((state) => state.lastActivePortalId);
  const setScrollProgress = useScrollStore((state) => state.setScrollProgress);

  useFrame((state, delta) => {
    if (data) {
      const a = data.range(0, 0.3);
      const b = data.range(0.3, 0.5);
      const d = data.range(0.85, 0.18);

      if (!isActive) {
        // Speed up exit animation by 30% for other-ventures on mobile, camera speed to exit animation
        const speedMult = (isMobile && lastActivePortalId === 'other-ventures') ? 1.8 : (!isMobile && lastActivePortalId === 'work' ? 1.5 : 1);

        camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, -0.5 * Math.PI * a, 5 * speedMult, delta);
        if (isMobile) {
          camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, 0, 5 * speedMult, delta);
        }
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 7 * speedMult, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, -37 * b, 7 * speedMult, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 5 + 10 * d, 7 * speedMult, delta);

        setScrollProgress(data.range(0, 1));
      }

      // Move camera slightly on mouse movement.
      if (!isMobile && !isActive) {
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -(state.pointer.x * Math.PI) / 90, 0.05);
      }
    }
  });

  const children = Array.isArray(props.children) ? props.children : [props.children];

  return <>
    {children.map((child, index) => {
      return <group key={index}>
        {child}
      </group>
    })}
  </>
}

export default ScrollWrapper;