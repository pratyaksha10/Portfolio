import { useTexture } from '@react-three/drei';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { usePortalStore } from '@stores';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { isMobile } from 'react-device-detect';

const vertexShader = `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float index;
uniform float time;
uniform float size;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  float flapTime = radians(sin(time * 6.0 - length(position.xy) / size * 2.6 + index * 2.0) * 45.0 + 30.0);
  float hovering = cos(time * 2.0 + index * 3.0) * size / 16.0;
  vec3 updatePosition = vec3(
    cos(flapTime) * position.x,
    position.y + hovering,
    sin(flapTime) * abs(position.x) + hovering
  );

  vec4 mvPosition = modelViewMatrix * vec4(updatePosition, 1.0);
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
precision highp float;
uniform float index;
uniform float time;
uniform float size;
uniform float contrastMult;
uniform sampler2D texture;

varying vec3 vPosition;
varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; 
  vec3 x3 = x0 - D.yyy;      
  i = mod289(i);
  vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857; 
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

vec3 convertHsvToRgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 texColor = texture2D(texture, vUv);
  float noise = snoise3(vPosition / vec3(size * 0.25) + vec3(0.0, 0.0, time));
  
  // High saturation neon tint with unique hues per butterfly
  float hue = mod(index * 0.15 + noise * 0.1 + (time * 0.02), 1.0);
  vec3 hsv = vec3(hue, 1.0, 1.0);
  vec3 rgb = convertHsvToRgb(hsv);
  
  // Neon glow blend multiplier
  gl_FragColor = vec4(rgb * contrastMult, 1.0) * texColor;
}
`;

export interface ButterflyProps {
  index: number;
  onClick?: (e?: ThreeEvent<MouseEvent>) => void;
  onPointerEnter?: (e?: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: (e?: ThreeEvent<PointerEvent>) => void;
  boundsWidth?: number;
  boundsHeight?: number;
  scale?: number;
  contrastMult?: number;
}

const ButterflyModel = ({ index, onClick, onPointerEnter, onPointerLeave, boundsWidth, boundsHeight, scale = 1, contrastMult = 1.8 }: ButterflyProps) => {
  const activePortalId = usePortalStore((state) => state.activePortalId);
  const texture = useTexture('https://ykob.github.io/sketch-threejs/img/sketch/butterfly/tex.png');
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const materialRef = useRef<THREE.RawShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // On mobile, constrain the viewport to 40% so they never fly off screen and are easy to tap
  const bWidth = (boundsWidth || viewport.width) * (isMobile ? 0.4 : 1);
  const bHeight = (boundsHeight || viewport.height) * (isMobile ? 0.4 : 1);

  // Spawn inside a safe 50% inner zone so butterflies start on-screen
  const stateRef = useRef({
    x: (Math.random() - 0.5) * bWidth * 0.5,
    y: (Math.random() - 0.5) * bHeight * 0.5,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    isHovered: false
  });

  const uniforms = useMemo(() => ({
    index: { value: index },
    time: { value: Math.random() * 100 },
    size: { value: 0.52 * scale }, // Decreased by 35% from 0.80 -> 0.52, scaled
    texture: { value: texture },
    contrastMult: { value: contrastMult }
  }), [index, texture, scale, contrastMult]);

  // Derive neon color for the background light emitter glow
  const hue = (index * 0.15) % 1.0;
  const glowColor = useMemo(() => new THREE.Color().setHSL(hue, 1.0, 0.5), [hue]);

  useFrame((state, delta) => {
    // Safe guard delta jumps
    const dt = Math.min(delta, 0.1);

    if (materialRef.current) {
      materialRef.current.uniforms.time.value += dt;
    }

    if (groupRef.current) {
      if (!stateRef.current.isHovered) {
        // Organic Steering behavior
        stateRef.current.vx += (Math.random() - 0.5) * 0.1;
        stateRef.current.vy += (Math.random() - 0.5) * 0.1;

        // Velocity Limiter
        const maxV = 1.0;
        const currentV = Math.sqrt(stateRef.current.vx ** 2 + stateRef.current.vy ** 2);
        if (currentV > maxV) {
          stateRef.current.vx = (stateRef.current.vx / currentV) * maxV;
          stateRef.current.vy = (stateRef.current.vy / currentV) * maxV;
        }

        // Viewport Bounce — soft repulsion zone starts at 80% of edge butterfly wing swing effect
        const marginX = bWidth * 0.6;
        const marginY = bHeight * 0.6;
        const softX = marginX * 0.6;
        const softY = marginY * 0.6;

        // Graduated repulsion: gentle nudge in soft zone, strong push at hard edge
        if (stateRef.current.x > softX) stateRef.current.vx -= 0.15 + (stateRef.current.x - softX) * 0.6;
        if (stateRef.current.x < -softX) stateRef.current.vx += 0.15 + (-softX - stateRef.current.x) * 0.6;
        if (stateRef.current.y > softY) stateRef.current.vy -= 0.15 + (stateRef.current.y - softY) * 0.6;
        if (stateRef.current.y < -softY) stateRef.current.vy += 0.15 + (-softY - stateRef.current.y) * 0.6;

        // Position Updates
        stateRef.current.x += stateRef.current.vx * dt;
        stateRef.current.y += stateRef.current.vy * dt;

        // Hard clamp — absolute failsafe so no butterfly ever leaves the canvas
        stateRef.current.x = Math.max(-marginX, Math.min(marginX, stateRef.current.x));
        stateRef.current.y = Math.max(-marginY, Math.min(marginY, stateRef.current.y));
      }

      groupRef.current.position.set(stateRef.current.x, stateRef.current.y, 0);

      // Zoom effect if hovered inside Literature panel
      const targetScale = stateRef.current.isHovered && activePortalId === 'literature' ? scale * 3 : scale;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      // Face towards moving direction smoothly
      const angle = Math.atan2(-stateRef.current.vy, stateRef.current.vx);
      groupRef.current.rotation.set(-45 * Math.PI / 180, 0, angle - Math.PI / 2);
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* 3D Glowing Neon Point Light matching the butterfly hue */}
      <pointLight color={glowColor} intensity={1.5} distance={3} decay={2} position={[0, 0, -0.1]} />

      <mesh
        onPointerOver={(e) => { e.stopPropagation(); stateRef.current.isHovered = true; document.body.style.cursor = 'pointer'; if (onPointerEnter) onPointerEnter(e); }}
        onPointerOut={(e) => { stateRef.current.isHovered = false; document.body.style.cursor = 'auto'; if (onPointerLeave) onPointerLeave(e); }}
        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(e); }}
      >
        <planeGeometry args={[0.52, 0.26, 24, 12]} /> {/* Decreased size by 35% */}
        <rawShaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default ButterflyModel;
