import React from 'react';
import { TrendingUp, DollarSign, Zap } from 'lucide-react';

const Portfolio: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-400">
            Your Portfolio
          </h1>
          <p className="text-slate-400 mt-2">
            Track your investments and strategy performance
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="border border-indigo-500/30 rounded-xl bg-indigo-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <DollarSign size={20} />
              <span className="text-sm text-slate-400">Total Invested</span>
            </div>
            <div className="text-3xl font-bold">$125,400</div>
          </div>
          <div className="border border-green-500/30 rounded-xl bg-green-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 text-green-400">
              <TrendingUp size={20} />
              <span className="text-sm text-slate-400">Current Value</span>
            </div>
            <div className="text-3xl font-bold">$156,840</div>
            <div className="text-sm text-green-400 mt-1">+25.2% gain</div>
          </div>
          <div className="border border-purple-500/30 rounded-xl bg-purple-500/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 text-purple-400">
              <Zap size={20} />
              <span className="text-sm text-slate-400">YTD Returns</span>
            </div>
            <div className="text-3xl font-bold">+$31,440</div>
            <div className="text-sm text-purple-400 mt-1">APY: 125.3%</div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-12 text-center">
          <div className="text-slate-500 mb-4">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">Portfolio Details Coming Soon</p>
            <p className="text-sm mt-2">Strategy allocation, performance charts, and history</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
