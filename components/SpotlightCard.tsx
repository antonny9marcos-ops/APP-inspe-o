import React, { useRef } from 'react';

interface SpotlightCardProps {
  glowColor: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ glowColor, className = '', style, children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || !glowRef.current) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.background = `radial-gradient(280px circle at ${x}px ${y}px, ${glowColor}2E, transparent 65%)`;
  };

  return (
    <div
      ref={cardRef}
      className={className}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { if (glowRef.current) glowRef.current.style.opacity = '1'; }}
      onMouseLeave={() => { if (glowRef.current) glowRef.current.style.opacity = '0'; }}
    >
      <div ref={glowRef} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" />
      {children}
    </div>
  );
};
