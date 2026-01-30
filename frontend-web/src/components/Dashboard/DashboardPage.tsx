import React from 'react';
import StatsCard from './StatsCard';
import SignalPanel from './SignalPanel';
import RealTimeChart from './RealTimeChart';
import { useSignalStore } from '@/store/signalStore';
import { useStatsStore } from '@/store/statsStore';

export default function DashboardPage() {
  const { signals } = useSignalStore();
  const { stats } = useStatsStore();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <SignalPanel signals={signals} />

      {/* Real-Time Chart */}
      <RealTimeChart data={signals} />

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
    </div>
  );
}
