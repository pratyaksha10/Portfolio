import { Box, useTexture, useScroll, ScrollControls, Scroll } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { isMobile } from "react-device-detect";
import { usePortalStore } from "@stores";
import { Suspense, useCallback, useEffect, useRef } from "react";
import styles from "./OtherVentures.module.css";

const IMAGE_SRCS = [
  "/pursepics/Azure Crystal.jpg",
  "/pursepics/Mirage Sand.jpg",
  "/pursepics/Velvet Dusk.jpg",
  "/pursepics/Watermelon Sugar.jpg",
  "/pursepics/Bronze Tide.jpg",
  "/pursepics/Ethereal Rose.jpg",
];

const FACE_NAMES = [
  "AZURE CRYSTAL",
  "MIRAGE SAND",
  "VELVET DUSK",
  "WATERMELON SUGAR",
  "BRONZE TIDE",
  "ETHEREAL ROSE",
];

const N = IMAGE_SRCS.length;

const STOPS = [
  { rx: 90, ry: 0 },
  { rx: 0, ry: 0 },
  { rx: 0, ry: -90 },
  { rx: 0, ry: -180 },
  { rx: 0, ry: -270 },
  { rx: -90, ry: -360 },
];

/* ── Thumbnail (WebGL cube shown in grid) ──────────── */

const CubePreview = () => {
  const textures = useTexture([
    IMAGE_SRCS[2], IMAGE_SRCS[4], IMAGE_SRCS[0],
    IMAGE_SRCS[5], IMAGE_SRCS[1], IMAGE_SRCS[3],
  ]);

  return (
    <mesh scale={1.2}>
      <boxGeometry args={[1, 1, 1]} />
      {textures.map((tex, i) => (
        <meshBasicMaterial key={i} attach={`material-${i}`} map={tex} />
      ))}
    </mesh>
  );
};

/* ── Full-screen overlay (React portal to body) ────── */

const CubeOverlay = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const sceneNameRef = useRef<HTMLDivElement>(null);
  const captionNumRef = useRef<HTMLDivElement>(null);
  const captionNameRef = useRef<HTMLDivElement>(null);

  /* ── animation loop ────────────────────────────────── */
  useEffect(() => {
    const scroll = scrollRef.current;
    const cube = cubeRef.current;
    if (!scroll || !cube) return;

    // preload every image
    IMAGE_SRCS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // load initial face images onto the cube
    const faces = cube.querySelectorAll<HTMLElement>("[data-face]");
    faces.forEach((face, i) => {
      if (!IMAGE_SRCS[i]) return;
      let img = face.querySelector("img") as HTMLImageElement | null;
      if (!img) {
        img = document.createElement("img");
        face.appendChild(img);
      }
      img.src = IMAGE_SRCS[i];
      img.alt = FACE_NAMES[i] ?? "";
    });

    let lastFaceIdx = -1;

    const easeIO = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const setCubeTransform = (s: number) => {
      const t = s * (N - 1);
      const idx = Math.min(Math.floor(t), N - 2);
      const f = easeIO(t - idx);
      const a = STOPS[idx];
      const b = STOPS[idx + 1];
      const rx = a.rx + (b.rx - a.rx) * f;
      const ry = a.ry + (b.ry - a.ry) * f;
      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    const updateHUD = (s: number) => {
      const p = Math.round(s * 100);
      const si = Math.min(N - 1, Math.floor(s * (N - 1) + 0.5));

      if (progRef.current) progRef.current.style.width = `${p}%`;

      if (si !== lastFaceIdx) {
        lastFaceIdx = si;
        const name = FACE_NAMES[si] ?? "";
        if (sceneNameRef.current) sceneNameRef.current.textContent = name;
        if (captionNumRef.current)
          captionNumRef.current.textContent = String(si + 1).padStart(2, "0");
        if (captionNameRef.current)
          captionNameRef.current.textContent = name;

        // update nav dots
        rootRef.current
          ?.querySelectorAll(`.${styles.sceneDot}`)
          .forEach((d, i) =>
            d.classList.toggle(styles.sceneDotActive, i === si)
          );
      }
    };

    // ── IntersectionObserver for text reveals ──
    const revealEls = rootRef.current?.querySelectorAll(
      `.${styles.tag}, .${styles.heading}, .${styles.bodyText}, .${styles.statRow}, .${styles.cta}, .${styles.ctaBack}, .${styles.hLine}`
    );

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add(styles.visible);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, root: scroll }
    );
    revealEls?.forEach((el) => io.observe(el));

    // ── scroll-driven animation ──
    let smooth = 0;
    let frameId: number;

    const onFrame = () => {
      frameId = requestAnimationFrame(onFrame);
      const maxScroll = Math.max(1, scroll.scrollHeight - scroll.clientHeight);
      const tgt = scroll.scrollTop / maxScroll;
      smooth += (tgt - smooth) * 0.18;
      smooth = Math.max(0, Math.min(1, smooth));
      setCubeTransform(smooth);
      updateHUD(smooth);
    };

    frameId = requestAnimationFrame(onFrame);
    setCubeTransform(0);
    updateHUD(0);

    return () => {
      cancelAnimationFrame(frameId);
      io.disconnect();
    };
  }, []);

  /* ── smooth-scroll anchor clicks ──────────────────── */
  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const href = e.currentTarget.getAttribute("href");
      if (!href?.startsWith("#s")) return;
      e.preventDefault();
      const target = scrollRef.current?.querySelector(href);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  const anchor = (href: string, label: string, variant: "fwd" | "back") => {
    const cls = variant === "fwd" ? styles.cta : styles.ctaBack;
    const arrow =
      variant === "fwd" ? (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 6h10M6 1l5 5-5 5" />
        </svg>
      ) : (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M11 6H1M6 11L1 6l5-5" />
        </svg>
      );
    return (
      <a className={cls} href={href} onClick={handleAnchorClick}>
        {variant === "back" && arrow}
        {label}
        {variant === "fwd" && arrow}
      </a>
    );
  };

  /* ── JSX ──────────────────────────────────────────── */
  return (
    <div ref={rootRef} className={styles.root}>
      <a
        className={styles.buyNowBtn}
        href="https://crystalispurse.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Buy Now
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 6h10M6 1l5 5-5 5" />
        </svg>
      </a>

      {/* 3D cube scene */}
      <div className={styles.scene}>
        <div ref={cubeRef} className={styles.cube}>
          {["top", "front", "right", "back", "left", "bottom"].map((face) => (
            <div
              key={face}
              className={`${styles.face} ${styles[`face_${face}`]}`}
              data-face={face}
            >
              <span className={styles.facePh}>{face.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.progressBar}>
          <div ref={progRef} className={styles.progressFill} />
        </div>
        <div ref={sceneNameRef} className={styles.sceneLabel}>AZURE CRYSTAL</div>
      </div>

      {/* nav dots */}
      <div className={styles.sceneStrip}>
        {Array.from({ length: N }, (_, i) => (
          <a
            key={i}
            href={`#s${i}`}
            className={`${styles.sceneDot} ${i === 0 ? styles.sceneDotActive : ""}`}
            onClick={handleAnchorClick}
          />
        ))}
      </div>

      {/* face caption */}
      <div className={styles.faceCaption}>
        <div ref={captionNumRef} className={styles.faceCaptionNum}>01</div>
        <div ref={captionNameRef} className={styles.faceCaptionName}>AZURE CRYSTAL</div>
      </div>

      {/* credit */}
      <div className={styles.credit}>
        <a
          href="https://www.linkedin.com/posts/luis-martinez-lr_ai-creativity-reversecreativity-activity-7366853269517651970-zeUD"
          target="_blank"
          rel="noopener noreferrer"
        >
          Crystalispurse@gmail.com By Pratyaksha
        </a>
      </div>

      {/* scrollable content */}
      <div ref={scrollRef} className={styles.scrollContainer}>
        {/* section 0 */}
        <section id="s0" className={styles.section}>
          <div className={styles.textCard}>
            <div className={styles.tag}>1.Azure Crystal</div>
            <h1 className={styles.heading}>
              AZURE<br />CRYSTAL
            </h1>
            <p className={styles.bodyText}>
              A compact, structured mini tote crafted entirely from deep sapphire-toned faceted crystal beads with a rounded top handle.<br></br>
              Estimated Size:<br></br>
              Width: 16–18 cm<br></br>
              Height: 14–15 cm<br></br>
              Depth: 6–7 cm<br></br>

              Beads Used (Approx):<br></br>

              Bead type: 6–8 mm<br></br>
              Quantity: ~4500–5500 beads

            </p>
            <div className={styles.ctaRow}>
              {anchor("#s1", "Enter", "fwd")}
            </div>
          </div>
        </section>

        {/* section 1 */}
        <section id="s1" className={styles.section}>
          <div className={`${styles.textCard} ${styles.right}`}>
            <div className={styles.hLine} />
            <div className={styles.tag}>2.Mirage Sand</div>
            <h2 className={styles.heading}>MIRAGE<br />SAND</h2>
            <p className={styles.bodyText}>
              An intricately handcrafted mini bag that evokes the illusionary beauty of desert light shimmering over sand.<br></br>
              Estimated Size:<br></br>

              Width: 16–18 cm<br></br>
              Height: 15–17 cm<br></br>
              Depth: 7–8 cm<br></br>

              Beads Used (Approx):<br></br>

              Type: 6–8 mm(multi-color)<br></br>
              Quantity: ~5000–6000 beads
            </p>
            <div className={styles.ctaRow}>
              {anchor("#s0", "Back", "back")}
              {anchor("#s2", "Turn", "fwd")}
            </div>
          </div>
        </section>

        {/* section 2 */}
        <section id="s2" className={styles.section}>
          <div className={styles.textCard}>
            <div className={styles.hLine} />
            <div className={styles.tag}>3.Velvet Dusk</div>
            <h2 className={styles.heading}>VELVET<br />DUSK</h2>
            <p className={styles.bodyText}>
              A bold mini tote with deep violet beads contrasted by a diagonal silver crystal stripe and matching embellished handle.<br></br>

              Estimated Size:<br></br>

              Width: 17–19 cm<br></br>
              Height: 14–16 cm<br></br>
              Depth: 6–7 cm<br></br>

              Beads Used (Approx):<br></br>

              Bead type: 6 mm <br></br>
              Quantity: ~5000–6500 beads
            </p>
            <div className={styles.ctaRow}>
              {anchor("#s1", "Back", "back")}
              {anchor("#s3", "Turn", "fwd")}
            </div>
          </div>
        </section>

        {/* section 3 */}
        <section id="s3" className={styles.section}>
          <div className={`${styles.textCard} ${styles.right}`}>
            <div className={styles.hLine} />
            <div className={styles.tag}>4.Watermelon Sugar</div>
            <h2 className={styles.heading}>WATERMELON<br />SUGAR</h2>
            <p className={styles.bodyText}>
              A playful semicircular purse mimicking a watermelon slice, featuring red faceted beads for the body, green gradient edging, and black bead accents as seeds.<br></br>

              Estimated Size:<br></br>

              Width: 20–22 cm<br></br>
              Height: 12–14 cm<br></br>
              Depth: 5–6 cm<br></br>

              Beads Used (Approx):<br></br>

              Bead type: 5–7 mm<br></br>
              Quantity: ~4000–5000 beads<br></br>
            </p>

            <div className={styles.ctaRow}>
              {anchor("#s2", "Back", "back")}
              {anchor("#s4", "Turn", "fwd")}
            </div>
          </div>
        </section>

        {/* section 4 */}
        <section id="s4" className={styles.section}>
          <div className={styles.textCard}>
            <div className={styles.hLine} />
            <div className={styles.tag}>5.Bronze Tide</div>
            <h2 className={styles.heading}>
              BRONZE<br />TIDE
            </h2>
            <p className={styles.bodyText}>
              A high-detail luxury clutch featuring emerald green, black, and gold beads arranged in geometric patterns, finished with metallic hardware and a chain strap.<br></br>

              Estimated Size:<br></br>

              Width: 20–22 cm<br></br>
              Height: 13–15 cm<br></br>
              Depth: 6–8 cm<br></br>

              Beads Used (Approx):<br></br>

              Bead type: 6-8 mm <br></br>
              Quantity: ~5000–6000 beads
            </p>
            <div className={styles.ctaRow}>
              {anchor("#s3", "Back", "back")}
              {anchor("#s5", "Turn", "fwd")}
            </div>
          </div>
        </section>

        {/* section 5 */}
        <section id="s5" className={styles.section}>
          <div className={`${styles.textCard} ${styles.right}`}>
            <div className={styles.hLine} />
            <div className={styles.tag}>6.Ethereal Rose</div>
            <h2 className={styles.heading}>ETHEREAL<br />ROSE</h2>
            <p className={styles.bodyText}>
              A soft, feminine mini purse made from translucent blush beads, accented with a large satin bow for a delicate aesthetic.<br></br>

              Estimated Size:<br></br>

              Width: 15–17 cm<br></br>
              Height: 13–14 cm<br></br>
              Depth: 5–6 cm<br></br>

              Beads Used (Approx):<br></br>

              Bead type: 6–8 mm <br></br>
              Quantity: ~4000–5000 beads
            </p>
            <div className={styles.ctaRow}>
              {anchor("#s4", "Back", "back")}
              {anchor("#s0", "Begin again", "fwd")}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ── Main component ────────────────────────────────── */

const OtherVenturesInnerScroll = ({ isActive }: { isActive: boolean }) => {
  const data = useScroll();
  const wasActive = useRef(false);

  useEffect(() => {
    if (isActive) {
      wasActive.current = true;
      data.el.style.zIndex = '1';
    } else if (wasActive.current) {
      wasActive.current = false;
      data.el.style.zIndex = '-1';
    }
  }, [isActive, data.el]);

  return null;
};

const OtherVentures = () => {
  const isActive = usePortalStore((s) => s.activePortalId === "other-ventures");
  const mainData = useScroll();
  const wasActive = useRef(false);

  const { camera } = useThree();

  // hide parent scroll wrapper when portal is open
  useEffect(() => {
    const wrapper = mainData.el;
    if (isActive) {
      wasActive.current = true;
      if (wrapper) wrapper.style.zIndex = "-1";

      if (isMobile) {
        gsap.to(camera.position, { z: 11.5, y: -43, x: 1, duration: 1.5, ease: 'power3.inOut' });
      } else {
        gsap.to(camera.position, { y: -43, x: 2, duration: 1.5, ease: 'power3.inOut' });
      }
    } else if (wasActive.current) {
      wasActive.current = false;
      if (wrapper) wrapper.style.zIndex = "1";
    }
  }, [isActive, mainData.el, camera.position]);

  return (
    <group>
      {/* Thumbnail cube (shown in the grid) */}
      {!isActive && (
        <Suspense
          fallback={<Box scale={1.2}><meshBasicMaterial color="#222" /></Box>}
        >
          <CubePreview />
        </Suspense>
      )}

      {/* Full-screen overlay inside canvas using ScrollControls and Scroll html */}
      <ScrollControls style={{ zIndex: -1 }} pages={1}>
        <OtherVenturesInnerScroll isActive={isActive} />
        <Scroll html style={{
          width: '100%',
          height: '100%',
          opacity: isActive ? 1 : 0,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'opacity 0.6s ease-in-out'
        }}>
          {isActive && <CubeOverlay />}
        </Scroll>
      </ScrollControls>
    </group>
  );
};

export default OtherVentures;
