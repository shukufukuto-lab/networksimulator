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
  onComplete,
}: PacketAnimationProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!step || !fromPosition || !toPosition) return;
    const circle = circleRef.current;
    if (!circle) return;

    const animation = circle.animate(
      [
        { cx: `${fromPosition.x}`, cy: `${fromPosition.y}` },
        { cx: `${toPosition.x}`, cy: `${toPosition.y}` },
      ],
      { duration: 600, easing: "ease-in-out", fill: "forwards" }
    );

    animation.onfinish = () => {
      onCompleteRef.current();
    };

    return () => {
      animation.cancel();
    };
  }, [step, fromPosition, toPosition]);

  if (!step || !fromPosition || !toPosition) return null;

  return (
    <circle
      ref={circleRef}
      cx={fromPosition.x}
      cy={fromPosition.y}
      r={8}
      fill="#f38ba8"
      stroke="#1e1e2e"
      strokeWidth={2}
      pointerEvents="none"
    />
  );
}
