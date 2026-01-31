import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

// --- Border Beam ---
interface BorderBeamProps {
  color?: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({ 
  color = '#3b82f6', 
  duration = 10, 
  delay = 0,
  className = ''
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none rounded-xl overflow-hidden ${className}`}>
      <motion.div
        className="absolute -inset-[100%] opacity-60"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 340deg, ${color} 360deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: duration,
          ease: "linear",
          repeat: Infinity,
          delay: delay,
        }}
      />
    </div>
  );
};

// --- Glitch Text ---
const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

interface GlitchTextProps {
  text: string;
  trigger: any; // Value to trigger the glitch
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, trigger, className = '' }) => {
  const [displayText, setDisplayText] = useState(text);
  
  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 2; // Speed of decoding
    }, 30);

    return () => clearInterval(interval);
  }, [trigger, text]);

  return <span className={className}>{displayText}</span>;
};

// --- Particles (Confetti) ---
export const Particles: React.FC = () => {
  // Generate random particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    y: Math.random() * -300 - 50,
    scale: Math.random() * 0.5 + 0.5,
    color: Math.random() > 0.5 ? '#10b981' : '#34d399', // Emerald greens
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ 
            x: p.x, 
            y: p.y, 
            opacity: 0, 
            scale: p.scale,
            rotate: p.rotation
          }}
          transition={{ 
            duration: 1.5, 
            ease: "easeOut"
          }}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
};

// --- Shimmer Overlay ---
export const Shimmer: React.FC = () => {
  return (
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none"
      style={{
        background: 'linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
        transform: 'skewX(-20deg)',
      }}
      initial={{ x: '-150%' }}
      animate={{ x: '150%' }}
      transition={{
        repeat: Infinity,
        duration: 2.5,
        ease: "linear",
        repeatDelay: 1,
      }}
    />
  );
};
