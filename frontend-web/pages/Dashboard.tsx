import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Activity, DollarSign } from 'lucide-react';

interface Signal {
  type: 'HIGH_RISK_HEDGE' | 'MEDIUM_RISK_HEDGE' | 'LOW_RISK_HEDGE';
  riggingIndex: number;
  anomalyScore: number;
  gameId: string;
  timestamp: string;
}

interface Stats {
  totalTrades: number;
  totalProfit: number;
  winRate: number;
  activeSignals: number;
}

const Dashboard: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTrades: 0,
    totalProfit: 0,
    winRate: 0,
    activeSignals: 0,
  });

  useEffect(() => {
    // 模拟数据加载
    setSignals([
      {
        type: 'HIGH_RISK_HEDGE',
        riggingIndex: 0.85,
        anomalyScore: 0.92,
        gameId: 'NBA_20250131_LAL_BOS',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'MEDIUM_RISK_HEDGE',
        riggingIndex: 0.68,
        anomalyScore: 0.73,
        gameId: 'NBA_20250131_GSW_MIA',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
    ]);

    setStats({
      totalTrades: 147,
      totalProfit: 12450.32,
      winRate: 73.5,
      activeSignals: 2,
    });
  }, []);

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'HIGH_RISK_HEDGE':
        return 'border-red-500/30 bg-red-500/5 text-red-400';
      case 'MEDIUM_RISK_HEDGE':
        return 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400';
      case 'LOW_RISK_HEDGE':
        return 'border-green-500/30 bg-green-500/5 text-green-400';
      default:
        return 'border-slate-500/30 bg-slate-500/5 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-400">
            Integrity Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Real-time monitoring of betting anomalies and liquidity movements
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Activity size={20} />}
            label="Total Trades"
            value={stats.totalTrades}
            color="indigo"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Profit"
            value={`$${stats.totalProfit.toLocaleString()}`}
            color="green"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Win Rate"
            value={`${stats.winRate}%`}
            color="purple"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="Active Signals"
            value={stats.activeSignals}
            color="red"
            pulse
          />
        </div>

        {/* Active Signals */}
        <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity size={20} className="text-indigo-400" />
            Active Signals
          </h2>

          <div className="space-y-3">
            {signals.map((signal, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getSignalColor(signal.type)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-sm">{signal.type.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-400 mt-1">{signal.gameId}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <div className="text-xs text-slate-400">Rigging Index</div>
                    <div className="text-lg font-bold">{(signal.riggingIndex * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Anomaly Score</div>
                    <div className="text-lg font-bold">{(signal.anomalyScore * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-current/20">
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                    Execute Hedge →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {signals.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Activity size={48} className="mx-auto mb-4 opacity-20" />
              <p>No active signals detected</p>
            </div>
          )}
        </div>

        {/* Recent Trades */}
        <div className="mt-6 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
          <div className="text-slate-500 text-sm">Coming soon...</div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  pulse?: boolean;
}> = ({ icon, label, value, color, pulse }) => {
  const colorClasses = {
    indigo: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
    purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
  };

  return (
    <div className={`border rounded-xl p-4 ${colorClasses[color as keyof typeof colorClasses]} ${pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

export default Dashboard;
