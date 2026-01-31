import React, { useState } from 'react';
import { TrendingUp, Shield, AlertTriangle, Activity, ArrowRight } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  type: 'Rigging Detection' | 'Market Anomaly' | 'Hybrid Signal';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  apy: string;
  tvl: string;
  signals24h: number;
  accuracy: string;
  minStake: string;
  description: string;
  thresholds: {
    riggingIndex: string;
    anomalyScore: string;
  };
  status: 'Active' | 'Paused';
}

const StrategiesV2: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  const strategies: Strategy[] = [
    {
      id: 'high-risk-hedge',
      name: 'High-Risk Hedge',
      type: 'Hybrid Signal',
      riskLevel: 'HIGH',
      apy: '245.5%',
      tvl: '$1.25M',
      signals24h: 3,
      accuracy: '78.5%',
      minStake: '1000 USDC',
      description: 'Aggressive hedging on confirmed match-fixing signals. Requires both Twitter sentiment anomaly (RI > 0.75) and Polymarket liquidity drain (AS > 0.85).',
      thresholds: {
        riggingIndex: '> 0.75',
        anomalyScore: '> 0.85',
      },
      status: 'Active',
    },
    {
      id: 'medium-balanced',
      name: 'Medium-Risk Balanced',
      type: 'Hybrid Signal',
      riskLevel: 'MEDIUM',
      apy: '145.2%',
      tvl: '$3.45M',
      signals24h: 8,
      accuracy: '71.2%',
      minStake: '500 USDC',
      description: 'Standard hedging strategy with balanced risk/reward. Triggers on moderate Twitter buzz and market volatility.',
      thresholds: {
        riggingIndex: '> 0.65',
        anomalyScore: '> 0.75',
      },
      status: 'Active',
    },
    {
      id: 'low-conservative',
      name: 'Low-Risk Conservative',
      type: 'Market Anomaly',
      riskLevel: 'LOW',
      apy: '52.3%',
      tvl: '$5.68M',
      signals24h: 15,
      accuracy: '68.9%',
      minStake: '100 USDC',
      description: 'Conservative approach focusing on early anomaly detection with maximum capital preservation.',
      thresholds: {
        riggingIndex: '> 0.55',
        anomalyScore: '> 0.65',
      },
      status: 'Active',
    },
    {
      id: 'social-sentiment',
      name: 'Social Sentiment Arbitrage',
      type: 'Rigging Detection',
      riskLevel: 'MEDIUM',
      apy: '132.4%',
      tvl: '$2.34M',
      signals24h: 12,
      accuracy: '69.5%',
      minStake: '300 USDC',
      description: 'Exploits lag between Twitter sentiment shifts and Polymarket price adjustments. Focus on high-volume games.',
      thresholds: {
        riggingIndex: '> 0.70',
        anomalyScore: '> 0.60',
      },
      status: 'Active',
    },
  ];

  const getRiskBadge = (risk: string) => {
    const styles = {
      HIGH: 'bg-red-500/10 text-red-400 border-red-500/30',
      MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      LOW: 'bg-green-500/10 text-green-400 border-green-500/30',
    };
    return styles[risk as keyof typeof styles] || styles.MEDIUM;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">
            <span className="text-white">Featured </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Strategies
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Automated hedge strategies powered by social sentiment analysis and on-chain market data
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">Total Strategies</div>
            <div className="text-2xl font-bold">{strategies.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">Total TVL</div>
            <div className="text-2xl font-bold">$12.72M</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">Avg APY</div>
            <div className="text-2xl font-bold text-green-400">143.9%</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">24h Signals</div>
            <div className="text-2xl font-bold text-indigo-400">38</div>
          </div>
        </div>

        {/* Strategy Cards - Table Style */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase">
            <div className="col-span-3">Strategy</div>
            <div className="col-span-2">APY</div>
            <div className="col-span-2">Current TVL</div>
            <div className="col-span-2">24h Signals</div>
            <div className="col-span-2">Accuracy</div>
            <div className="col-span-1"></div>
          </div>

          {/* Strategy Rows */}
          {strategies.map((strategy, index) => (
            <div
              key={strategy.id}
              className={`
                group cursor-pointer transition-all
                ${index !== strategies.length - 1 ? 'border-b border-white/5' : ''}
                hover:bg-white/5
              `}
              onClick={() => setSelectedStrategy(selectedStrategy === strategy.id ? null : strategy.id)}
            >
              {/* Main Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5">

                {/* Strategy Info */}
                <div className="col-span-12 md:col-span-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      strategy.riskLevel === 'HIGH' ? 'bg-red-500/20' :
                      strategy.riskLevel === 'MEDIUM' ? 'bg-yellow-500/20' :
                      'bg-green-500/20'
                    }`}>
                      {strategy.riskLevel === 'HIGH' ? <AlertTriangle size={20} className="text-red-400" /> :
                       strategy.riskLevel === 'MEDIUM' ? <Activity size={20} className="text-yellow-400" /> :
                       <Shield size={20} className="text-green-400" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">{strategy.name}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${getRiskBadge(strategy.riskLevel)}`}>
                          {strategy.riskLevel}
                        </span>
                        <span className="text-xs text-slate-500">{strategy.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* APY */}
                <div className="col-span-6 md:col-span-2 flex items-center">
                  <div>
                    <div className="text-slate-400 text-xs md:hidden mb-1">APY</div>
                    <div className="text-xl font-bold text-green-400">{strategy.apy}</div>
                  </div>
                </div>

                {/* TVL */}
                <div className="col-span-6 md:col-span-2 flex items-center">
                  <div>
                    <div className="text-slate-400 text-xs md:hidden mb-1">TVL</div>
                    <div className="text-lg font-semibold text-white">{strategy.tvl}</div>
                  </div>
                </div>

                {/* 24h Signals */}
                <div className="col-span-6 md:col-span-2 flex items-center">
                  <div>
                    <div className="text-slate-400 text-xs md:hidden mb-1">24h Signals</div>
                    <div className="text-lg font-semibold text-indigo-400">{strategy.signals24h}</div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="col-span-6 md:col-span-2 flex items-center">
                  <div>
                    <div className="text-slate-400 text-xs md:hidden mb-1">Accuracy</div>
                    <div className="text-lg font-semibold text-purple-400">{strategy.accuracy}</div>
                  </div>
                </div>

                {/* Details Button */}
                <div className="col-span-12 md:col-span-1 flex items-center justify-end">
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <ArrowRight size={20} className={`transform transition-transform ${
                      selectedStrategy === strategy.id ? 'rotate-90' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedStrategy === strategy.id && (
                <div className="px-6 pb-6 border-t border-white/10 bg-black/20">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Left Column */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Description</h4>
                      <p className="text-sm text-slate-400 mb-4">{strategy.description}</p>

                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Signal Thresholds</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Rigging Index:</span>
                          <span className="text-white font-mono">{strategy.thresholds.riggingIndex}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Anomaly Score:</span>
                          <span className="text-white font-mono">{strategy.thresholds.anomalyScore}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">Investment Details</h4>
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400 text-sm">Min Stake:</span>
                          <span className="text-white font-semibold">{strategy.minStake}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400 text-sm">Status:</span>
                          <span className="text-green-400 font-semibold">{strategy.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Network:</span>
                          <span className="text-purple-400 font-semibold">Polygon Amoy</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all">
                          View Details
                        </button>
                        <button className="py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                          Invest Now
                          <TrendingUp size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-indigo-400 mt-1">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-indigo-300 mb-1">How It Works</div>
              <p className="text-sm text-slate-400">
                Strategies automatically execute hedges when signal thresholds are met. Profits are distributed on-chain:
                <span className="text-white font-semibold"> 50% hedge fund</span>,
                <span className="text-white font-semibold"> 5% ops</span>,
                <span className="text-white font-semibold"> 45% users</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategiesV2;
