import React from 'react';
import { BarChart2, Maximize2, Zap, AlertTriangle, Activity, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import { MetricPoint } from '../types';
import { useSimulation } from '../context/SimulationContext';
import { BorderBeam, GlitchText, Particles, Shimmer } from './VisualEffects';

// Safe Data
const DATA_SAFE: MetricPoint[] = [
  { time: '10:00', integrityScore: 98, bettingVolume: 2400 },
  { time: '10:05', integrityScore: 97, bettingVolume: 3200 },
  { time: '10:10', integrityScore: 98, bettingVolume: 2800 },
  { time: '10:15', integrityScore: 99, bettingVolume: 2500 },
  { time: '10:20', integrityScore: 98, bettingVolume: 3100 },
  { time: '10:25', integrityScore: 97, bettingVolume: 2900 },
  { time: '10:30', integrityScore: 98, bettingVolume: 2600 },
  { time: '10:35', integrityScore: 99, bettingVolume: 2400 },
  { time: '10:40', integrityScore: 98, bettingVolume: 2200 },
];

// Critical Data (Crash)
const DATA_CRITICAL: MetricPoint[] = [
  { time: '10:00', integrityScore: 98, bettingVolume: 2400 },
  { time: '10:05', integrityScore: 97, bettingVolume: 3200 },
  { time: '10:10', integrityScore: 85, bettingVolume: 4800 },
  { time: '10:15', integrityScore: 60, bettingVolume: 8500 },
  { time: '10:20', integrityScore: 45, bettingVolume: 12100 },
  { time: '10:25', integrityScore: 30, bettingVolume: 15900 },
  { time: '10:30', integrityScore: 15, bettingVolume: 18600 },
  { time: '10:35', integrityScore: 12, bettingVolume: 21200 },
  { time: '10:40', integrityScore: 10, bettingVolume: 24500 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-slate-400 text-xs font-mono mb-2">{label} UTC</p>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-xs text-white">Score: {payload[0].value}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="w-2 h-2 rounded-full bg-purple-500/50"></div>
          <span className="text-xs text-slate-300">Vol: ${payload[1].value}k</span>
        </div>
      </div>
    );
  }
  return null;
};

const MainAnalysis: React.FC = () => {
  const { mode, isHedged, executeHedge } = useSimulation();

  const chartData = mode === 'SAFE' ? DATA_SAFE : DATA_CRITICAL;
  
  // Dynamic Values
  const netExposure = mode === 'SAFE' ? '$4.2M' : (isHedged ? '$0.0M' : '$12.8M');
  const exposureColor = mode === 'SAFE' ? 'text-white' : (isHedged ? 'text-green-400' : 'text-red-500');
  
  const riskLabel = mode === 'SAFE' ? 'LOW' : (isHedged ? 'MITIGATED' : 'CRITICAL');
  const riskColor = mode === 'SAFE' ? 'text-green-400' : (isHedged ? 'text-emerald-400' : 'text-red-500 animate-pulse');
  const RiskIcon = mode === 'SAFE' ? ShieldCheck : (isHedged ? CheckCircle2 : AlertTriangle);

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* Confetti Explosion Layer */}
      {isHedged && <Particles />}

      {/* Top Key Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Net Exposure */}
        <GlassCard className="p-4" delay={0.2}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Net Exposure</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold font-mono transition-colors duration-500 ${exposureColor}`}>
             <GlitchText text={netExposure} trigger={mode + isHedged} />
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {isHedged ? 'Hedge Active' : (mode === 'CRITICAL' ? '+210% vs avg' : '+12.5% vs avg')}
          </div>
        </GlassCard>
        
        {/* Risk Level - The "Risk Card" with Border Beam */}
        <GlassCard className={`p-4 transition-colors duration-500 ${mode === 'CRITICAL' && !isHedged ? 'bg-red-950/20' : ''}`} delay={0.3}>
          {/* Border Beam Effect */}
          <BorderBeam 
            color={mode === 'SAFE' || isHedged ? '#6366f1' : '#ef4444'} 
            duration={mode === 'SAFE' || isHedged ? 8 : 1.5}
          />

          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Risk Level</span>
            <RiskIcon className={`w-4 h-4 ${riskColor}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${riskColor}`}>
            <GlitchText text={riskLabel} trigger={riskLabel} />
          </div>
           <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
             {isHedged ? 'Protocol Safe' : (mode === 'CRITICAL' ? 'Immediate Action Req' : 'System Nominal')}
          </div>
        </GlassCard>

        {/* PnL / Active Nodes */}
        <GlassCard className="p-4 relative overflow-hidden" delay={0.4}>
          <AnimatePresence mode='wait'>
            {isHedged ? (
              <motion.div 
                key="profit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-emerald-400 uppercase tracking-wider font-bold">Total Profit</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">+$5,200</div>
                <div className="text-xs text-emerald-500/70 mt-1">Arbitrage Secured</div>
                <div className="absolute inset-0 bg-emerald-500/5 blur-xl -z-10" />
              </motion.div>
            ) : (
               <motion.div 
                 key="nodes"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
               >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Active Nodes</span>
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">842</div>
                <div className="text-xs text-slate-400 mt-1">100% Uptime</div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Main Chart or Hedge Action */}
      <div className="flex-1 relative flex flex-col min-h-[300px]">
        {/* The Action Overlay for Critical Mode */}
        <AnimatePresence>
          {mode === 'CRITICAL' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none"
            >
              {!isHedged ? (
                // ACTION BUTTON with Shimmer
                <div className="pointer-events-auto relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={executeHedge}
                    className="group relative overflow-hidden rounded-xl bg-red-600 px-12 py-6 shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all hover:bg-red-500 hover:shadow-[0_0_60px_rgba(220,38,38,0.7)]"
                  >
                    {/* Shimmer Effect */}
                    <Shimmer />
                    
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] opacity-20" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <Zap className="h-8 w-8 text-white fill-white" />
                      <span className="text-xl font-black tracking-widest text-white font-mono">EXECUTE HEDGE</span>
                      <span className="text-xs font-bold text-red-100 bg-black/20 px-2 py-0.5 rounded">PROTECT LIQUIDITY</span>
                    </div>
                  </motion.button>
                </div>
              ) : (
                // SUCCESS BANNER
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="w-full max-w-2xl"
                >
                  <div className="relative overflow-hidden rounded-xl border border-emerald-500/50 bg-emerald-900/80 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-emerald-100">HEDGE SUCCESSFUL</h3>
                        <p className="font-mono text-sm text-emerald-300">Transaction Confirmed on Polygon (Tx: 0x7a...39)</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">+$5,200.00</div>
                        <div className="text-xs text-emerald-300">PnL Realized</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart Background (Dimmed in Critical) */}
        <GlassCard title="Real-time Integrity Velocity" icon={<BarChart2 className="w-4 h-4" />} className={`flex-1 transition-opacity duration-500 ${mode === 'CRITICAL' && !isHedged ? 'opacity-30 blur-sm' : 'opacity-100'}`} delay={0.5}>
          <div className="w-full h-full relative">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={mode === 'SAFE' ? "#6366f1" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={mode === 'SAFE' ? "#6366f1" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  tick={{fontSize: 10, fontFamily: 'JetBrains Mono'}} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{fontSize: 10, fontFamily: 'JetBrains Mono'}} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="bettingVolume" 
                  stroke="#a855f7" 
                  strokeWidth={1} 
                  fillOpacity={1} 
                  fill="url(#colorVol)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="integrityScore" 
                  stroke={mode === 'SAFE' ? "#6366f1" : "#ef4444"} 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            
            <button className="absolute top-0 right-0 p-2 text-slate-500 hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default MainAnalysis;