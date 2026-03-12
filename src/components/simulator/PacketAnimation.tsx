"use client";

import { useEffect, useRef } from "react";

interface PacketAnimationProps {
  step: SimulationStep | null;
  fromPosition: { x: number; y: number } | null;
  toPosition: { x: number; y: number } | null;
  onComplete: () => void;
}

export default function PacketAnimation({
  step,
  fromPosition,
  toPosition,
}: PacketAnimationProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!step || !fromPosition || !toPosition) return;
    const circle = circleRef.current;
    if (!circle) return;

    const animation = circle.animate(
      [
        { cx: `${fromPosition.x}`, cy: `${fromPosition.y}` },
        { cx: `${toPosition.x}`, cy: `${toPosition.y}` },
      ],
      { duration: 600, easing: "ease-in-out", iterations: Infinity }
    );

    return () => {
      animation.cancel();
    };
  }, [step, fromPosition, toPosition]);

  if (!step || !fromPosition || !toPosition) return null;

  const gradId = `packet-grad-${step.direction}`;
  const baseColor = step.direction === "outbound" ? "#f38ba8" : "#a6e3a1";

  return (
    <>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor={baseColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        ref={circleRef}
        cx={fromPosition.x}
        cy={fromPosition.y}
        r={10}
        fill={`url(#${gradId})`}
        pointerEvents="none"
      />
    </>
  );
}
