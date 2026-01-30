import { create } from 'zustand';
import { Trade } from '@/types';

interface TradeStore {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  clearTrades: () => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  trades: [],

  addTrade: (trade) =>
    set((state) => ({
      trades: [trade, ...state.trades]
    })),

  updateTrade: (id, updates) =>
    set((state) => ({
      trades: state.trades.map(t =>
        t.id === id ? { ...t, ...updates } : t
      )
    })),

  clearTrades: () => set({ trades: [] })
}));
