import React, { useState } from 'react';
import { Target, TrendingUp, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedAPY: number;
  currentTVL: number;
  winRate: number;
  description: string;
  parameters: Record<string, number>;
}

const Strategies: React.FC = () => {
  const [selectedRisk, setSelectedRisk] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const strategies: Strategy[] = [
    {
      id: 'high-hedge-aggressive',
      name: 'High-Risk Hedge (Aggressive)',
      riskLevel: 'HIGH',
      expectedAPY: 245.5,
      currentTVL: 1250000,
      winRate: 78.5,
      description: 'Leveraged hedging for high-confidence anomaly signals (Rigging Index > 0.75, Anomaly Score > 0.85)',
      parameters: {
        riggingThreshold: 0.75,
        anomalyThreshold: 0.85,
        leverage: 1.5,
        maxPosition: 5000,
      },
    },
    {
      id: 'medium-hedge-balanced',
      name: 'Medium-Risk Hedge (Balanced)',
      riskLevel: 'MEDIUM',
      expectedAPY: 145.2,
      currentTVL: 3450000,
      winRate: 71.2,
      description: 'Standard hedging for medium-confidence signals with balanced risk/reward',
      parameters: {
        riggingThreshold: 0.65,
        anomalyThreshold: 0.75,
        leverage: 1.0,
        maxPosition: 3000,
      },
    },
    {
      id: 'low-hedge-conservative',
      name: 'Low-Risk Hedge (Conservative)',
      riskLevel: 'LOW',
      expectedAPY: 52.3,
      currentTVL: 5680000,
      winRate: 68.9,
      description: 'Conservative hedging for early-stage anomaly detection with maximum safety',
      parameters: {
        riggingThreshold: 0.55,
        anomalyThreshold: 0.65,
        leverage: 0.5,
        maxPosition: 1500,
      },
    },
    {
      id: 'social-sentiment',
      name: 'Social Sentiment Arb',
      riskLevel: 'MEDIUM',
      expectedAPY: 132.4,
      currentTVL: 2340000,
      winRate: 69.5,
      description: 'Arbitrage based on Twitter sentiment changes and market lag',
      parameters: {
        sentimentThreshold: 0.7,
        minTweetVolume: 100,
        holdingPeriod: 2,
        leverage: 0.8,
      },
    },
    {
      id: 'liquidity-drainage',
      name: 'Liquidity Drainage',
      riskLevel: 'HIGH',
      expectedAPY: 198.6,
      currentTVL: 890000,
      winRate: 75.3,
      description: 'Exploit sudden liquidity drains and price cascades',
      parameters: {
        liquidityThreshold: 10000,
        spreadThreshold: 500,
        leverage: 2.0,
        maxPosition: 4000,
      },
    },
  ];

  const filteredStrategies = selectedRisk === 'ALL'
    ? strategies
    : strategies.filter(s => s.riskLevel === selectedRisk);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'MEDIUM':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'LOW':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return <AlertTriangle size={16} />;
      case 'MEDIUM':
        return <Shield size={16} />;
      case 'LOW':
        return <CheckCircle size={16} />;
      default:
        return <Target size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-400">
            Hedging Strategies
          </h1>
          <p className="text-slate-400 mt-2">
            Choose from multiple automated hedge strategies with different risk/reward profiles
          </p>
        </div>

        {/* Risk Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(risk => (
            <button
              key={risk}
              onClick={() => setSelectedRisk(risk as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedRisk === risk
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>

        {/* Strategies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStrategies.map(strategy => (
            <StrategyCard key={strategy.id} strategy={strategy} riskColor={getRiskColor} riskIcon={getRiskIcon} />
          ))}
        </div>

        {filteredStrategies.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Target size={48} className="mx-auto mb-4 opacity-20" />
            <p>No strategies found for selected risk level</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StrategyCard: React.FC<{
  strategy: Strategy;
  riskColor: (risk: string) => string;
  riskIcon: (risk: string) => React.ReactNode;
}> = ({ strategy, riskColor, riskIcon }) => {
  return (
    <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{strategy.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{strategy.id}</p>
        </div>
        <div className={`px-3 py-1 rounded-lg border flex items-center gap-1 text-xs font-medium ${riskColor(strategy.riskLevel)}`}>
          {riskIcon(strategy.riskLevel)}
          {strategy.riskLevel}
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4">{strategy.description}</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-slate-400">Expected APY</div>
          <div className="text-lg font-bold text-green-400">{strategy.expectedAPY}%</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-slate-400">Current TVL</div>
          <div className="text-lg font-bold text-indigo-400">${(strategy.currentTVL / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-slate-400">Win Rate</div>
          <div className="text-lg font-bold text-purple-400">{strategy.winRate}%</div>
        </div>
      </div>

      {/* Parameters */}
      <div className="mb-4 p-3 bg-black/40 rounded-lg">
        <div className="text-xs text-slate-400 font-semibold mb-2">Parameters</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(strategy.parameters).map(([key, value]) => (
            <div key={key} className="flex justify-between text-slate-300">
              <span className="text-slate-500">{key}:</span>
              <span>{typeof value === 'number' && value < 10 ? value.toFixed(2) : value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button className="py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
          View Details
        </button>
        <button className="py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors">
          Invest Now
        </button>
      </div>
    </div>
  );
};

export default Strategies;
