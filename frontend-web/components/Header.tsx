import React from 'react';
import { Shield, Wallet, CircleDollarSign } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Shield className="w-5 h-5 text-white fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight leading-none">NBA INTEGRITY</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-none mt-1">Guard Protocol v2.0</span>
          </div>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#" className="hover:text-white transition-colors">Alerts</a>
            <a href="#" className="hover:text-white transition-colors">Governance</a>
          </nav>

          {/* Connected Wallet State (Hardcoded for Demo) */}
          <div className="group relative px-4 py-2 rounded-full bg-black border border-white/10 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex flex-col items-end leading-none">
                <span className="text-xs font-bold text-white font-mono">$12,450.00 USDC</span>
                <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-white/10">
                 <Wallet className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;