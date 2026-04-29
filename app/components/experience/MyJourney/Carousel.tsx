import { useEffect, useMemo, useState } from "react";
import { isMobile } from "react-device-detect";
import GenericProjectTile from "../Common/GenericProjectTile";

import { PROJECTS } from "@constants";
import { usePortalStore } from "@stores";

const Carousel = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const isActive = usePortalStore((state) => state.activePortalId === "projects");

  useEffect(() => {
    if (!isActive) setActiveId(null);
  }, [isActive]);

  const onClick = (id: number) => {
    if (!isMobile) return;
    setActiveId(id === activeId ? null : id);
  };

  const tiles = useMemo(() => {
    const fov = Math.PI;
    const distance = 13;
    const count = PROJECTS.length;

    return PROJECTS.map((project, i) => {
      const angle = (fov / count) * i;
      const z = -distance * Math.sin(angle);
      const x = -distance * Math.cos(angle);
      const rotY = Math.PI / 2 - angle;

      return (
        <GenericProjectTile
          key={i}
          project={project}
          index={i}
          position={[x, 1, z]}
          rotation={[0, rotY, 0]}
          activeId={activeId}
          onClick={() => onClick(i)}
          portalId="projects"
        />
      );
    });
  }, [activeId, isActive]);

  return (
    <group position={[0, 2, 0]} rotation={[0, -Math.PI / 12, 0]}>
      {tiles}
    </group>
  );
};

export default Carousel;