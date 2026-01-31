import React, { createContext, useContext, useState, useEffect } from 'react';

type Mode = 'SAFE' | 'CRITICAL';

interface SimulationContextType {
  mode: Mode;
  isHedged: boolean;
  toggleMode: () => void;
  executeHedge: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>('SAFE');
  const [isHedged, setIsHedged] = useState(false);

  const toggleMode = () => {
    setMode(prev => {
      const newMode = prev === 'SAFE' ? 'CRITICAL' : 'SAFE';
      // Reset hedge when entering safe mode, or when toggling generally
      if (newMode === 'SAFE') setIsHedged(false);
      return newMode;
    });
  };

  const executeHedge = () => {
    setIsHedged(true);
  };

  return (
    <SimulationContext.Provider value={{ mode, isHedged, toggleMode, executeHedge }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation must be used within a SimulationProvider");
  return context;
};