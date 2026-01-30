import { create } from 'zustand';
import { Stats } from '@/types';

interface StatsStore {
  stats: Stats;
  updateStats: (updates: Partial<Stats>) => void;
  resetStats: () => void;
}

const initialStats: Stats = {
  signalsProcessed: 0,
  tradesGenerated: 0,
  distributionsExecuted: 0,
  totalErrors: 0,
  currentRiggingIndex: 0,
  currentAnomalyScore: 0,
  winRate: 0,
  totalProfit: 0
};

export const useStatsStore = create<StatsStore>((set) => ({
  stats: initialStats,

  updateStats: (updates) =>
    set((state) => ({
      stats: { ...state.stats, ...updates }
    })),

  resetStats: () => set({ stats: initialStats })
}));
