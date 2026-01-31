import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  delay?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
      className={`relative group rounded-xl border border-white/10 bg-black/40 backdrop-blur-md flex flex-col ${className}`}
      // Removed overflow-hidden from parent to allow some effects to bleed if needed, 
      // but usually we want it clipped. Keeping it safe for now.
      style={{ overflow: 'hidden' }} 
    >
      {/* Subtle Gradient Glow Effect on Hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none rounded-xl" />
      
      {/* Header if provided */}
      {(title || icon) && (
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 relative z-20 bg-black/20">
          <div className="flex items-center gap-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            <h3 className="text-sm font-medium tracking-wide text-slate-200 uppercase">{title}</h3>
          </div>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-5 flex-1 overflow-auto relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;