/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";

import { Canvas } from '@react-three/fiber';

import ButterflyModel from "../../models/Butterfly";

export default function Hero({ isActive = true }: { isActive?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activePoem, setActivePoem] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: -100, y: -100 });
  const timeRef = useRef(0);

  const POEMS = [
    {
      // Butterfly 1 — Rebirth
      stanzas: [
        [
          "In countless lifetimes, I'd choose to be reborn,",
          "For in each one, it's your presence I'd adorn.",
          "No matter the cycle, no matter the hue,",
          "Each time, I'd seek you, for my soul knows it's true."
        ]
      ]
    },
    {
      // Butterfly 2 — Open Eyes
      stanzas: [
        [
          "Should I close my eyes, lost in search of a face unknown?",
          "Or keep them open, letting destiny's winds be blown?",
          "For love may come when least expected, a delightful surprise,",
          "Unveiling a soul's connection, glistening in love's sunrise."
        ]
      ]
    },
    {
      // Butterfly 3 — Destiny & Choice
      stanzas: [
        [
          "For while destiny weaves its intricate design,",
          "Our personal choices make the moments shine.",
          "But in the dance of life, we hold the key,",
          "To shape our own future, to set ourselves free."
        ]
      ]
    },
    {
      // Butterfly 4 — Together Strong
      stanzas: [
        [
          "Through life's twists and turns, we'll remain strong,",
          "Choosing love, where we truly belong.",
          "No obstacle too great, no distance too far,",
          "With you by my side, we'll reach every star."
        ]
      ]
    },
    {
      // Butterfly 5 — Choosing You
      stanzas: [
        [
          "No matter the world's noise or the paths we tread,",
          "I choose you, my love, where true happiness spreads.",
          "Together we'll create a love that's sublime,",
          "Choosing each other, until the end of time."
        ]
      ]
    },
    {
      // Butterfly 6 — The Seesaw
      stanzas: [
        [
          "Life is a seesaw, with two souls on either side,",
          "Relations acting as the pivot, where balance resides.",
          "Through understanding, we keep each other strong,",
          "Building a foundation where love and harmony belong."
        ]
      ]
    },
    {
      // Butterfly 7 — Fate's Whisper
      stanzas: [
        [
          "The whispers of fate, a mystical call,",
          "Our intuition's whisper, guiding us through it all.",
          "With each step we take, our path unfurls,",
          "Crafting our story, as destiny twirls."
        ]
      ]
    },
    {
      // Butterfly 8 — Everything Happens for a Reason
      stanzas: [
        [
          "Everything happens for a reason,",
          "And we ourselves have already decided what we must do.",
          "As you get to know yourself better,",
          "You will know what your future holds,",
          "What you can hold on to — and what you can let go."
        ]
      ]
    }
  ];

  // Background Parallax: Auto-drifting combined with cursor reactivity
  useEffect(() => {
    let frameId: number;
    // We store the target offset for the mouse position safely
    // to combine it dynamically into the continuous animate loop.
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize from -1 to 1
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      timeRef.current += 0.005; // Slow ambient time progression

      if (videoRef.current) {
        // Automatically drift in continuous subtle circles/lissajous
        const autoDriftX = Math.sin(timeRef.current * 0.8) * 4;
        const autoDriftY = Math.cos(timeRef.current * 1.2) * 4;

        // Sum automatic drift tracking with user's mouse position
        // REDUCED BY 20%: Changed multiplier from 6 to 4.8
        const combinedX = autoDriftX + (targetX * 4.8);
        const combinedY = autoDriftY + (targetY * 4.8);

        // Required to keep bounds smooth: Scale 1.2 prevents white bars showing on large translational offsets
        videoRef.current.style.transform = `translate3d(${combinedX}%, ${combinedY}%, 0) scale(1.2)`;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="literature-hero-container relative min-h-screen w-screen overflow-hidden bg-transparent pointer-events-none">

      {/* Top center text */}
      <h2
        className="absolute top-10 left-1/2 -translate-x-1/2 z-50 text-white/90 tracking-widest text-xl drop-shadow-md italic whitespace-nowrap"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        Catch the Butterfly 🦋
      </h2>

      {/* Video Background with Continuous Animation (Fully Visible) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-transform duration-75 ease-out will-change-transform"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Popup Poem Animation */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center transition-all duration-700 ease-in-out ${activePoem !== null ? 'opacity-100 pointer-events-auto backdrop-blur-sm' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setActivePoem(null)}
      >
        <div
          className={`w-[90%] md:w-[60%] p-6 md:p-14 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-2xl ${activePoem !== null ? 'scale-100 translate-y-0 opacity-100' : 'scale-[0.85] translate-y-12 opacity-0'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-white text-center" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {activePoem !== null && POEMS[activePoem].stanzas.map((stanza, si) => (
              <div key={si} className={si > 0 ? 'mt-8' : ''}>
                {stanza.map((line, li) => (
                  <p
                    key={li}
                    className={`text-lg md:text-4xl leading-relaxed tracking-wide italic drop-shadow-md ${li % 2 === 0 ? 'text-white/90' : 'text-white/70'
                      }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-14">
            <button
              className="px-8 py-3 border border-white/40 rounded-full hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-[0.2em] text-xs font-semibold text-white/80 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
              onClick={() => setActivePoem(null)}
            >
              Close Tale
            </button>
            <button
              className="px-8 py-3 border border-white/40 rounded-full hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-[0.2em] text-xs font-semibold text-white/80 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
              onClick={() => {
                window.open('https://www.freepik.com/free-vector/coming-soon-display-background-with-focus-light_18505068.htm#fromView=keyword&page=1&position=2&uuid=248a95e6-0aef-431e-8a92-6c26bc11274b&query=Coming+soon', '_blank', 'noopener,noreferrer');
              }}
            >
              Buy Book
            </button>
          </div>
        </div>
      </div>

      {/* 3D Butterflies Layer */}
      {isActive && (
        <div className="absolute inset-0 z-20 pointer-events-auto">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <ButterflyModel
                key={idx}
                index={idx}
                onClick={() => setActivePoem(idx)}
                onPointerEnter={(e: any) => {
                  setHoveredIndex(idx);
                  // track raw DOM pos to render 2D text next to it
                  if (e?.clientX && e?.clientY) setMouseCanvasPos({ x: e.clientX, y: e.clientY });
                }}
                onPointerLeave={() => setHoveredIndex(null)}
              />
            ))}
          </Canvas>
        </div>
      )}

      {hoveredIndex !== null && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-300 ease-out animate-fade-rise"
          style={{
            left: mouseCanvasPos.x + 15,
            top: mouseCanvasPos.y + 15
          }}
        >
          <span
            className="whitespace-nowrap text-3xl italic tracking-[0.1em] text-white brightness-150 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Read Poem
          </span>
        </div>
      )}

      {/* Scoped Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500&display=swap');

        .literature-hero-container {
          --font-display: 'Instrument Serif', serif;
          --font-body: 'Inter', sans-serif;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        @keyframes fade-rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-rise { animation: fade-rise 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>
    </div>
  );
}
