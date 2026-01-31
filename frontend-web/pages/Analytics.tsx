import React from 'react';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-400">
            Analytics & Research
          </h1>
          <p className="text-slate-400 mt-2">
            Deep dive into market data, signal performance, and backtesting results
          </p>
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-white/10 rounded-xl bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <BarChart3 size={24} />
              <span className="font-semibold">Signal Performance</span>
            </div>
            <p className="text-sm text-slate-400">Historical signal accuracy and win rates by game type</p>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-4 text-green-400">
              <TrendingUp size={24} />
              <span className="font-semibold">Market Trends</span>
            </div>
            <p className="text-sm text-slate-400">Real-time Polymarket trends and liquidity analysis</p>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-4 text-purple-400">
              <Target size={24} />
              <span className="font-semibold">Backtesting</span>
            </div>
            <p className="text-sm text-slate-400">Test strategies against historical data (2023-2024)</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm p-12 text-center">
          <div className="text-slate-500 mb-4">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">Detailed Analytics Coming Soon</p>
            <p className="text-sm mt-2">Interactive charts, data export, and advanced filtering</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
