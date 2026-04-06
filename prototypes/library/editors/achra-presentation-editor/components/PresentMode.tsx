import { useState, useEffect, useCallback, useRef } from "react";
import type { Slide } from "../../../document-models/achra-presentation/gen/schema/types.js";
import { AchraStyles } from "./AchraStyles.js";
import { SlideRenderer } from "./SlideRenderer.js";
import { PresentProvider } from "./PresentContext.js";

interface PresentModeProps {
  slides: Slide[];
  initialSlideIndex?: number;
  onExit: () => void;
}

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

const noop = () => {};

export function PresentMode({
  slides,
  initialSlideIndex = 0,
  onExit,
}: PresentModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const slide = slides[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
        case "PageDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          e.preventDefault();
          onExit();
          break;
        case "Home":
          e.preventDefault();
          setCurrentIndex(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentIndex(slides.length - 1);
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onExit, slides.length]);

  // Calculate scale to fit viewport
  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleX = w / SLIDE_WIDTH;
      const scaleY = h / SLIDE_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Request fullscreen on mount
  useEffect(() => {
    const el = containerRef.current;
    if (el && document.fullscreenElement !== el) {
      el.requestFullscreen?.().catch(() => {
        // Fullscreen may be blocked; still show the overlay
      });
    }
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onExit();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [onExit]);

  if (!slide) return null;

  return (
    <div
      ref={containerRef}
      className="achra-editor achra-present"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "none",
        fontFamily: "'Inter', sans-serif",
      }}
      onClick={(e) => {
        // Click left third to go back, rest to go forward
        const rect = (e.target as HTMLElement).closest(
          ".achra-present",
        )?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) {
          goPrev();
        } else {
          goNext();
        }
      }}
    >
      <PresentProvider value={true}>
      <AchraStyles />
      <style>{`
        .achra-present .item-delete,
        .achra-present .add-item-btn {
          display: none !important;
        }
        .achra-present .achra-slide * {
          cursor: default !important;
        }
        .achra-present .achra-slide button {
          pointer-events: none !important;
        }
        .achra-present [contenteditable]:hover,
        .achra-present [contenteditable]:focus {
          box-shadow: none !important;
        }
        .achra-present [contenteditable]:empty::before {
          display: none !important;
        }
      `}</style>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            boxShadow: "0 0 80px rgba(0,0,0,0.5)",
          }}
        >
          <SlideRenderer
            slide={slide}
            onUpdateContent={noop}
          />
        </div>
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 16,
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          fontFamily: "'Inter', sans-serif",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {currentIndex + 1} / {slides.length}
      </div>
      </PresentProvider>
    </div>
  );
}
