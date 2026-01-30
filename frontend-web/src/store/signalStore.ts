import { create } from 'zustand';
import { Signal } from '@/types';

interface SignalStore {
  signals: Signal[];
  addSignal: (signal: Signal) => void;
  updateSignal: (timestamp: string, updates: Partial<Signal>) => void;
  removeSignal: (timestamp: string) => void;
  clearSignals: () => void;
}

export const useSignalStore = create<SignalStore>((set) => ({
  signals: [],

  addSignal: (signal) =>
    set((state) => {
      // Prevent duplicates
      const exists = state.signals.some(s => s.timestamp === signal.timestamp);
      if (exists) return state;

      // Keep only the latest 100 signals
      return {
        signals: [signal, ...state.signals].slice(0, 100)
      };
    }),

  updateSignal: (timestamp, updates) =>
    set((state) => ({
      signals: state.signals.map(s =>
        s.timestamp === timestamp ? { ...s, ...updates } : s
      )
    })),

  removeSignal: (timestamp) =>
    set((state) => ({
      signals: state.signals.filter(s => s.timestamp !== timestamp)
    })),

  clearSignals: () => set({ signals: [] })
}));
