import { Text, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { usePortalStore } from "@stores";
import { useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from 'three';
import GridTile from "./GridTile";
import Literature from "./Literature";
import OtherVentures from "./OtherVentures";
import MyJourney from "./MyJourney";
import Work from "./work";



const Experience = () => {
  const titleRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const data = useScroll();
  const isActive = usePortalStore((state) => !!state.activePortalId);

  const fontProps = {
    font: "./soria-font.ttf",
    fontSize: 0.5,
    color: 'white',
  };

  useFrame((sate, delta) => {
    const d = data.range(0.8, 0.2);
    const e = data.range(0.7, 0.2);

    if (groupRef.current && !isActive) {
      const targetY = d > 0 ? (isMobile ? -1.4 : -1) : -30;
      groupRef.current.position.y = targetY;
      groupRef.current.visible = d > 0;
    }

    if (titleRef.current) {
      titleRef.current.children.forEach((text, i) => {
        const diffX = isMobile ? 0.4 : 0.8;
        const diffY = isMobile ? 0.48 : 0.64;

        // Phase 1: Diagonal fall
        const fallProgress = Math.min(1, d / 0.7);
        const yFall = Math.max(Math.min((1 - fallProgress) * (10 - i), 10), isMobile ? 1.0 : 0.5);

        // Phase 2: Shift horizontal to vertical one by one
        // Complete the animation by d=1.0. Total duration is 0.3.
        // Stagger by 0.02 * 9 letters = 0.18. Individual duration = 0.12.
        const shiftStart = 0.4 + i * 0.02;
        const shiftProgress = Math.min(1, Math.max(0, (d - shiftStart) / 0.12));
        const smoothEase = shiftProgress * shiftProgress * (3 - 2 * shiftProgress);

        const finalX = -4; // used for desktop only
        const finalY = isMobile ? 0.3 : -i * diffY;

        const targetX = isMobile ? (i * diffX) : (i * diffX) * (1 - smoothEase) + finalX * smoothEase;
        const targetY = yFall * (1 - smoothEase) + finalY * smoothEase;

        text.position.x = THREE.MathUtils.damp(text.position.x, targetX, 7, delta);
        text.position.y = THREE.MathUtils.damp(text.position.y, targetY, 7, delta);

        /* eslint-disable  @typescript-eslint/no-explicit-any */
        (text as any).fillOpacity = e;
      });
    }
  });

  const getTitle = () => {
    const title = 'experience'.toUpperCase();
    return title.split('').map((char, i) => {
      const diffX = isMobile ? 0.4 : 0.8;
      return (
        <Text key={i} {...fontProps} position={[i * diffX, 10, 1]}>{char}</Text>
      );
    });
  };

  return (
    <group position={[0, -41.5, 12]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      {/* <mesh receiveShadow position={[-5, 0, 0.1]}>
        <planeGeometry args={[10, 5, 1]} />
        <shadowMaterial opacity={0.1} />
      </mesh> */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <group ref={titleRef} position={[isMobile ? -1.8 : -3.6, 2, -2]}>
          {getTitle()}
        </group>

        <group position={[0, -1, 0]} ref={groupRef}>
          <GridTile title='WORK'
            id="work"
            color='#b9c6d6'
            textAlign='left'
            position={new THREE.Vector3(isMobile ? 0 : -1.6, isMobile ? 1.8 : 1.5, 0)}>
            <Work />
          </GridTile>
          <GridTile title='MyJourney'
            id="projects"
            color='#bdd1e3'
            textAlign='right'
            position={new THREE.Vector3(isMobile ? 0 : 1.6, isMobile ? 0.6 : 1.5, 0)}>
            <MyJourney />
          </GridTile>
          <GridTile title='LITERATURE'
            id="literature"
            color='#1a1a1a'
            textAlign='left'
            position={new THREE.Vector3(isMobile ? 0 : -1.6, isMobile ? -0.6 : -1.5, 0)}>
            <Literature />
          </GridTile>
          <GridTile title='OTHER VENTURES'
            id="other-ventures"
            color='#1a1a1a'
            textAlign='right'
            position={new THREE.Vector3(isMobile ? 0 : 1.6, isMobile ? -1.8 : -1.5, 0)}>
            <OtherVentures />
          </GridTile>
        </group>
      </group>
    </group>
  );
};

export default Experience;