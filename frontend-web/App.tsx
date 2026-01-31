import React from 'react';
import Header from './components/Header';
import LiveFeed from './components/LiveFeed';
import MainAnalysis from './components/MainAnalysis';
import ExecutionLog from './components/ExecutionLog';
import { useSimulation } from './context/SimulationContext';

const App: React.FC = () => {
  const { toggleMode, mode } = useSimulation();

  return (
    <div className="min-h-screen bg-void font-sans text-white selection:bg-indigo-500/30 flex flex-col">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.02]" />
        
        {/* Ambient Glows */}
        <div className={`absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full blur-[128px] transition-colors duration-1000 ${mode === 'SAFE' ? 'bg-indigo-500/20' : 'bg-red-500/10'}`} />
        <div className={`absolute bottom-[-20%] right-[10%] w-[400px] h-[400px] rounded-full blur-[128px] transition-colors duration-1000 ${mode === 'SAFE' ? 'bg-purple-500/10' : 'bg-orange-500/10'}`} />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 lg:p-8">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
                Integrity Dashboard
              </h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Monitoring real-time betting anomalies and liquidity movements across decentralized sports markets.
              </p>
            </div>
            {mode === 'CRITICAL' && (
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono animate-pulse">
                SIMULATION MODE: THREAT DETECTED
              </div>
            )}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)] min-h-[600px]">
            
            {/* Col 1: Live Feed */}
            <div className="lg:col-span-3 h-full overflow-hidden">
              <LiveFeed />
            </div>

            {/* Col 2: Main Analysis (Wide) */}
            <div className="lg:col-span-6 h-full overflow-hidden">
              <MainAnalysis />
            </div>

            {/* Col 3: Execution Log */}
            <div className="lg:col-span-3 h-full overflow-hidden">
              <ExecutionLog />
            </div>
            
          </div>
        </main>
        
        {/* Hidden Trigger Footer */}
        <footer className="py-4 text-center text-[10px] text-white/5 hover:text-white/20 transition-colors cursor-pointer select-none" onClick={toggleMode}>
          © 2024 NBA Integrity Guard Protocol. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default App;