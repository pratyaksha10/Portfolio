import { Box, Edges, Line, Text, TextProps } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { usePortalStore } from "@stores";
import gsap from "gsap";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

import { WORK_TIMELINE } from "@constants";
import { WorkTimelinePoint } from "@types";

const reusableLeft = new THREE.Vector3(-0.3, 0, -0.1);
const reusableRight = new THREE.Vector3(0.3, 0, -0.1);

const TimelinePoint = React.memo(({ point, diff }: { point: WorkTimelinePoint, diff: number }) => {
  const getPoint = useMemo(() => {
    if (isMobile) return new THREE.Vector3(0, 0, -0.1);
    if (point.position === 'left') return reusableLeft;
    if (point.position === 'right') return reusableRight;
    return new THREE.Vector3();
  }, [point.position]);

  const textAlign = isMobile ? 'center' : (point.position === 'left' ? 'right' : 'left');

  const textProps: Partial<TextProps> = useMemo(() => ({
    font: "./Vercetti-Regular.woff",
    color: "white",
    anchorX: textAlign,
    fillOpacity: 2 - 2 * diff,
  }), [textAlign, diff]);

  const titleProps = useMemo(() => ({
    ...textProps,
    font: "./soria-font.ttf",
    fontSize: 0.6,
    maxWidth: 3,
  }), [textProps]);

  return (
    <group position={point.point} scale={isMobile ? 0.35 : 0.6}>
      {/* The timeline node - a glowing core within the box */}
      <Box args={[0.22, 0.22, 0.22]} position={[0, 0, -0.1]} scale={[1 - diff, 1 - diff, 1 - diff]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        <Edges color="#ffffff" lineWidth={2} />
      </Box>
      <mesh position={[0, 0, -0.1]} scale={[0.1 * (1 - diff), 0.1 * (1 - diff), 0.1 * (1 - diff)]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <group>
        <group position={getPoint}>
          {/* Connector Line */}
          <Line 
            points={[
              new THREE.Vector3(0, 0, 0), 
              new THREE.Vector3(isMobile ? 0 : (point.position === 'left' ? -0.5 : 0.5), isMobile ? -0.8 : 0, 0)
            ]} 
            color="#ffffff" 
            lineWidth={0.5} 
            transparent 
            opacity={0.3 * (1 - diff)} 
          />

          {/* Premium Glass Card */}
          <group position={[isMobile ? 0 : (point.position === 'left' ? -2.2 : 2.2), isMobile ? -2.8 : -1.5, -0.2]}>
            {/* Card Background - Frosted Glass Effect */}
            <mesh>
              <planeGeometry args={[4.2, 3.6]} />
              <meshBasicMaterial color="#0a0a0a" transparent opacity={0.7 * (1 - diff)} />
            </mesh>
            
            {/* Glossy Overlay */}
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[4.2, 3.6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.03 * (1 - diff)} />
            </mesh>

            {/* Left/Right accent border based on position */}
            <mesh position={[isMobile ? -2.08 : (point.position === 'left' ? 2.08 : -2.08), 0, 0.02]}>
              <planeGeometry args={[0.04, 3.6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8 * (1 - diff)} />
            </mesh>

            {/* Year Badge */}
            <group position={[isMobile ? 0 : (point.position === 'left' ? 1.5 : -1.5), 1.4, 0.05]}>
              <mesh>
                <planeGeometry args={[0.8, 0.35]} />
                <meshBasicMaterial color="white" transparent opacity={0.9 * (1 - diff)} />
              </mesh>
              <Text 
                {...textProps} 
                color="black" 
                fontSize={0.2} 
                position={[0, 0, 0.01]} 
                anchorX="center" 
                anchorY="middle"
                fillOpacity={1 - diff}
              >
                {point.year}
              </Text>
            </group>

            {/* Title & Subtitle */}
            <group position={[0, 0.2, 0.1]}>
              <Text
                {...titleProps}
                fontSize={0.4}
                maxWidth={3.6}
                lineHeight={1.2}
                anchorX="center"
                anchorY="middle"
                textAlign="center"
                position={[0, 0, 0]}
                fillOpacity={1 - diff}
              >
                {point.title.toUpperCase()}
              </Text>
              
              <Text 
                {...textProps} 
                fontSize={0.18} 
                position={[0, -1.2, 0]}
                anchorX="center"
                anchorY="top"
                textAlign="center"
                fillOpacity={0.6 * (1 - diff)}
              >
                {point.subtitle}
              </Text>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

TimelinePoint.displayName = 'TimelinePoint';

const Timeline = ({ progress }: { progress: number }) => {
  const { camera } = useThree();
  const isActive = usePortalStore((state) => state.activePortalId === 'work');
  const timeline = useMemo(() => WORK_TIMELINE, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(timeline.map(p => p.point), false), [timeline]);
  const curvePoints = useMemo(() => curve.getPoints(500), [curve]);
  const visibleCurvePoints = useMemo(() => curvePoints.slice(0, Math.max(1, Math.ceil(progress * curvePoints.length))), [curvePoints, progress]);
  const visibleTimelinePoints = useMemo(() => timeline.slice(0, Math.max(1, Math.round(progress * (timeline.length - 1) + 1))), [timeline, progress]);

  const [visibleDashedCurvePoints, setVisibleDashedCurvePoints] = useState<THREE.Vector3[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const landingFinished = useRef(false);

  useFrame((_, delta) => {
    if (!isActive) return; // skip when not visible — saves GPU
    const position = curve.getPoint(progress);
    if (landingFinished.current) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, (isMobile ? 0 : -2) + position.x, 5.8, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, -39 + position.z, 5.8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 13 - position.y, 5.8, delta);
    }
  });

  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    if (groupRef.current) {
      tl.to(groupRef.current.scale, {
        x: isActive ? 1 : 0,
        y: isActive ? 1 : 0,
        z: isActive ? 1 : 0,
        duration: isActive ? 1 : (isMobile ? 1 : 0.67),
        delay: isActive ? 0.4 : 0,
      });
      tl.to(groupRef.current.position, {
        y: isActive ? 0 : -2,
        duration: isActive ? 1 : (isMobile ? 1 : 0.67),
        delay: isActive ? 0.4 : 0,
      }, 0);
    }

    if (isActive) {
      let i = 0;
      landingFinished.current = false;
      clearInterval(intervalRef.current!);
      setTimeout(() => {
        landingFinished.current = true;
        intervalRef.current = setInterval(() => {
          const p = i++ / 100;
          setVisibleDashedCurvePoints(curvePoints.slice(0, Math.max(1, Math.ceil(p * curvePoints.length))));
          if (i > 100 && intervalRef.current) clearInterval(intervalRef.current);
        }, 10);
      }, 1000);
    } else {
      setVisibleDashedCurvePoints([]);
      clearInterval(intervalRef.current!);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isActive]);

  return (
    <group position={[0, -0.9, -0.1]}>
      <Line points={visibleCurvePoints} color="white" lineWidth={3} />
      {visibleDashedCurvePoints.length > 0 && (
        <Line
          points={visibleDashedCurvePoints}
          color="white"
          lineWidth={0.5}
          dashed
          dashSize={0.25}
          gapSize={0.25}
        />
      )}
      <group ref={groupRef}>
        {visibleTimelinePoints.map((point, i) => {
          const diff = Math.min(2 * Math.max(i - (progress * (timeline.length - 1)), 0), 1);
          return <TimelinePoint point={point} key={i} diff={diff} />;
        })}
      </group>
    </group>
  );
};

export default Timeline;
