"use client";

import React, { useState, useRef, useEffect } from "react";
import { Portal } from "./Portal";

interface CustomTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export const CustomTooltip = ({ children, content }: CustomTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <Portal>
          <div
            className="absolute z-[9999] pointer-events-none animate-in fade-in zoom-in duration-200"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: "translate(-50%, -100%)",
              marginBottom: "12px",
            }}
          >
            <div className="relative bottom-3">
              {content}
              {/* Arrow */}
              <div 
                className="absolute top-[99%] left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white drop-shadow-sm"
              ></div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
