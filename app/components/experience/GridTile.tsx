
import { Edges, MeshPortalMaterial, Text, TextProps, useScroll } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { usePortalStore } from '@stores';
import gsap from "gsap";
import { useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import * as THREE from 'three';
import { TriangleGeometry } from './Triangle';

interface GridTileProps {
  id: string;
  title: string;
  textAlign: TextProps['textAlign'];
  children: React.ReactNode;
  color: string;
  position: THREE.Vector3;
}

// TODO: Rename this
const GridTile = (props: GridTileProps) => {
  const titleRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Group>(null);
  const hoverBoxRef = useRef<THREE.Mesh>(null);
  const overlayRef = useRef<THREE.Mesh>(null);
  const portalRef = useRef(null);
  const { title, textAlign, children, color, position, id } = props;
  const { camera } = useThree();
  const setActivePortal = usePortalStore((state) => state.setActivePortal);
  const isActive = usePortalStore((state) => state.activePortalId === id);
  const activePortalId = usePortalStore((state) => state.activePortalId);
  const data = useScroll();

  useEffect(() => {
    // Hanlde the hover box and title animation for mobile.
    if (isMobile && titleRef.current) {
      const isDarkText = id === 'work' || id === 'projects';
      gsap.to(titleRef.current, {
        color: isDarkText ? '#ffffffff' : '#fff',
        letterSpacing: 0.2,
      });
      gsap.to(titleRef.current.position, {
        x: 0,
        y: id === 'work' ? -0.27 : (id === 'projects' ? -0.054 : (id === 'other-ventures' ? 0.211 : (id === 'literature' ? 0.1 : 0))),
        duration: 0.5,
      });
      if (overlayRef.current) {
        gsap.to(overlayRef.current.position, {
          y: id === 'work' ? -0.15 : (id === 'projects' ? -0.02 : (id === 'other-ventures' ? 0.211 : (id === 'literature' ? 0.08 : 0))),
          duration: 0.1,
        });
      }
    }
  }, []);

  useFrame(() => {
    const d = data.range(0.95, 0.05);
    if (isMobile && titleRef.current) {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      (titleRef.current as any).fillOpacity = d;
      if (overlayRef.current) {
        (overlayRef.current.material as any).opacity = d * 0.2;
      }
    }
  });

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      exitPortal(true);
    }
  };

  const portalInto = (e: React.MouseEvent) => {
    if (isActive || activePortalId) return;
    e.stopPropagation();
    setActivePortal(id);
    document.body.style.cursor = 'auto';
    const div = document.createElement('div');

    div.className = 'fixed close';
    div.style.transform = 'rotateX(90deg)';
    div.onclick = () => exitPortal(true);

    if (!document.querySelector('.close')) {
      document.body.appendChild(div);

      gsap.fromTo(div, {
        scale: 0,
        rotate: '-180deg',
      }, {
        opacity: 1,
        zIndex: 10,
        transform: 'rotateX(0deg)',
        scale: 1,
        duration: 1,
      })
    }
    document.body.addEventListener('keydown', handleEscape);
    gsap.to(portalRef.current, {
      blend: 1,
      duration: 0.6,
      ease: 'power3.inOut'
    });
  };

  const exitPortal = (force = false) => {
    if (!force && !activePortalId) return;
    setActivePortal(null)

    // Unified adaptive duration for all panels (Work, Literature, MyJourney, OtherVentures)
    const cameraDuration = isMobile ? 1.0 : 1.5;
    const blendDuration = isMobile ? (id === 'other-ventures' ? 0.56 : 0.8) : (id === 'work' ? 0.8 : 1.2);

    gsap.to(portalRef.current, {
      blend: 0,
      duration: blendDuration,
      ease: 'power2.inOut'
    });

    // Remove the div from the dom
    gsap.to(document.querySelector('.close'), {
      scale: 0,
      duration: 0.5,
      onComplete: () => {
        document.querySelectorAll('.close').forEach((el) => {
          el.remove();
        });
      }
    })
    document.body.removeEventListener('keydown', handleEscape);
  }

  const fontProps: Partial<TextProps> = {
    font: "./soria-font.ttf",
    maxWidth: isMobile ? 3 : 2,
    anchorX: 'center',
    anchorY: isMobile ? 'middle' : 'bottom',
    fontSize: isMobile ? 0.25 : 0.7,
    color: isMobile ? (id === 'work' || id === 'projects' ? '#ffffffff' : '#ffffffff') : 'white',
    textAlign: textAlign,
    fillOpacity: 0,
  };

  const onPointerOver = () => {
    if (isActive || isMobile) return;
    document.body.style.cursor = 'pointer';
    gsap.to(titleRef.current, {
      fillOpacity: 1
    });
    if (gridRef.current && hoverBoxRef.current) {
      gsap.to(gridRef.current.position, { z: 0.35, duration: 0.4 });
      gsap.to(hoverBoxRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
    }
  };

  const onPointerOut = () => {
    if (isMobile) return;
    document.body.style.cursor = 'auto';
    gsap.to(titleRef.current, {
      fillOpacity: 0
    });
    if (gridRef.current && hoverBoxRef.current) {
      gsap.to(gridRef.current.position, { z: 0, duration: 0.4 });
      gsap.to(hoverBoxRef.current.scale, { x: 0, y: 0, z: 0, duration: 0.4 });
    }
  };

  const getGeometry = () => {
    if (!isMobile) {
      return <planeGeometry args={[2.8, 2.8, 1]} />
    }

    return <planeGeometry args={[3.2, 1.1, 1]} />
  };

  return (
    <mesh ref={gridRef}
      position={position}
      onClick={portalInto}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}>
      {getGeometry()}
      <group>
        <mesh position={[0, 0, -0.01]} ref={hoverBoxRef} scale={[0, 0, 0]}>
          <boxGeometry args={[isMobile ? 3.2 : 2.8, isMobile ? 1.1 : 2.8, 0.4]} />
          <meshPhysicalMaterial
            color="#444"
            transparent={true}
            opacity={0.3}
          />
          <Edges color="white" lineWidth={3} />
        </mesh>
        <Text position={[0, isMobile ? (id === 'work' ? -0.22 : (id === 'projects' ? -0.054 : (id === 'other-ventures' ? 0.211 : (id === 'literature' ? 0.1 : 0)))) : -1.3, 0.6]} {...fontProps} ref={titleRef}>
          {title}
        </Text>
        {isMobile && (
          <mesh
            ref={overlayRef}
            position={[0, id === 'work' ? -0.22 : (id === 'projects' ? -0.054 : (id === 'other-ventures' ? 0.211 : (id === 'literature' ? 0.1 : 0))), 0.35]}
          >
            <planeGeometry args={[2.999, 0.5]} />
            <meshBasicMaterial color="black" transparent opacity={0} />
          </mesh>
        )}
      </group>
      <MeshPortalMaterial ref={portalRef} blend={0} resolution={0} blur={0}>
        <color attach="background" args={[color]} />
        {children}
      </MeshPortalMaterial>
    </mesh>
  );
}

export default GridTile;