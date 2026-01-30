import React, { useEffect } from 'react';
import Header from './components/Dashboard/Header';
import StatsCard from './components/Dashboard/StatsCard';
import SignalPanel from './components/Dashboard/SignalPanel';
import RealTimeChart from './components/Dashboard/RealTimeChart';
import { useWebSocket } from './hooks/useWebSocket';
import { useSignalStore } from './store/signalStore';
import { useStatsStore } from './store/statsStore';

function App() {
  const { signals, addSignal } = useSignalStore();
  const { stats, updateStats } = useStatsStore();

  const { isConnected, lastMessage } = useWebSocket({
    url: 'ws://localhost:3000',
    onMessage: (data) => {
      console.log('[App] WebSocket message received:', data);

      // Handle different message types
      if (data.type === 'signal') {
        addSignal(data.payload);
      } else if (data.type === 'stats') {
        updateStats(data.payload);
      }
    },
    onOpen: () => {
      console.log('[App] WebSocket connected');
    },
    onClose: () => {
      console.log('[App] WebSocket disconnected');
    }
  });

  // Fetch initial stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/stats');
        const data = await response.json();
        updateStats(data);
      } catch (error) {
        console.error('[App] Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [updateStats]);

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header isConnected={isConnected} />

      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Rigging Index"
            value={stats.currentRiggingIndex}
            format="number"
            trend={stats.currentRiggingIndex > 0.5 ? 'up' : 'neutral'}
            color={stats.currentRiggingIndex > 0.7 ? 'danger' : 'warning'}
            subtitle="Current suspicion level"
          />
          <StatsCard
            title="Anomaly Score"
            value={stats.currentAnomalyScore}
            format="number"
            trend={stats.currentAnomalyScore > 0.6 ? 'up' : 'neutral'}
            color={stats.currentAnomalyScore > 0.8 ? 'danger' : 'warning'}
            subtitle="Market irregularities"
          />
          <StatsCard
            title="Active Signals"
            value={signals.filter(s => s.status === 'active').length}
            format="number"
            trend="neutral"
            color="primary"
            subtitle={`${stats.signalsProcessed} total processed`}
          />
          <StatsCard
            title="Win Rate"
            value={stats.winRate}
            format="percentage"
            trend={stats.winRate > 0.6 ? 'up' : 'down'}
            color={stats.winRate > 0.6 ? 'primary' : 'danger'}
            subtitle={`${stats.tradesGenerated} trades executed`}
          />
        </div>

        {/* Signal Panel */}
        <div className="mb-8">
          <SignalPanel signals={signals} />
        </div>

        {/* Real-Time Chart */}
        <div className="mb-8">
          <RealTimeChart data={signals} />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-2">
              Total Profit
            </h3>
            <p className="text-2xl font-bold text-primary-400">
              ${stats.totalProfit.toLocaleString()}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-2">
              Distributions
            </h3>
            <p className="text-2xl font-bold text-slate-100">
              {stats.distributionsExecuted}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-2">
              System Errors
            </h3>
            <p className={`text-2xl font-bold ${
              stats.totalErrors > 0 ? 'text-danger-400' : 'text-primary-400'
            }`}>
              {stats.totalErrors}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>© 2025 NBA Integrity Guard. All rights reserved.</p>
            <p>Powered by Web3 & Machine Learning</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
