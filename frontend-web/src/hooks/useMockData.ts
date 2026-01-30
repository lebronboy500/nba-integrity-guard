import { useEffect } from 'react';
import { useSignalStore } from '@/store/signalStore';
import { useTradeStore } from '@/store/tradeStore';
import { useStatsStore } from '@/store/statsStore';
import {
  generateMockSignals,
  generateMockTrades,
  generateMockStats,
  MockWebSocketSimulator
} from '@/utils/mockData';

/**
 * Hook to populate stores with mock data
 * Use this for local development and testing
 */
export function useMockData(enabled: boolean = true) {
  const { addSignal } = useSignalStore();
  const { addTrade } = useTradeStore();
  const { updateStats } = useStatsStore();

  useEffect(() => {
    if (!enabled) return;

    console.log('[MockData] Loading mock data...');

    // Generate initial data
    const signals = generateMockSignals(20);
    const trades = generateMockTrades(50);
    const stats = generateMockStats();

    // Populate stores
    signals.forEach(signal => addSignal(signal));
    trades.forEach(trade => addTrade(trade));
    updateStats(stats);

    console.log('[MockData] Loaded:', {
      signals: signals.length,
      trades: trades.length,
      stats
    });

    // Start WebSocket simulator
    const simulator = new MockWebSocketSimulator((message) => {
      if (message.type === 'signal') {
        addSignal(message.payload);
      } else if (message.type === 'stats') {
        updateStats(message.payload);
      } else if (message.type === 'trade') {
        addTrade(message.payload);
      }
    });

    // Send updates every 10 seconds
    simulator.start(10000);

    // Cleanup
    return () => {
      simulator.stop();
    };
  }, [enabled, addSignal, addTrade, updateStats]);
}
