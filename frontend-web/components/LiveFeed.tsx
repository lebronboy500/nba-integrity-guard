import React from 'react';
import { Activity, AlertTriangle, ArrowUpRight, Signal, Skull } from 'lucide-react';
import GlassCard from './GlassCard';
import { FeedItem } from '../types';
import { useSimulation } from '../context/SimulationContext';

const FEED_SAFE: FeedItem[] = [
  { id: '1', timestamp: '10:42:05', event: 'Odds Anomaly: LAL vs BOS', severity: 'low', value: '+4% Vol' },
  { id: '2', timestamp: '10:41:55', event: 'Whale Buy: $24k', severity: 'medium', value: 'DraftKings' },
  { id: '3', timestamp: '10:40:12', event: 'Player Injury Status', severity: 'low', value: 'Confirmed' },
  { id: '4', timestamp: '10:38:45', event: 'Smart Money Flow', severity: 'medium', value: 'Side: Under' },
  { id: '5', timestamp: '10:35:20', event: 'Ref Assignment Update', severity: 'low', value: 'Foster, S.' },
  { id: '6', timestamp: '10:34:01', event: 'Spread Shift', severity: 'low', value: '-2.5 -> -3.0' },
  { id: '7', timestamp: '10:30:15', event: 'Social Sentiment Drop', severity: 'low', value: '-8% Neg' },
];

const FEED_CRITICAL: FeedItem[] = [
  { id: 'c1', timestamp: '10:45:12', event: 'SUSPICIOUS BETTING DETECTED', severity: 'high', value: '+850% VOL' },
  { id: 'c2', timestamp: '10:45:01', event: 'FLASH ARBITRAGE ATTACK', severity: 'high', value: 'CRITICAL' },
  { id: 'c3', timestamp: '10:44:55', event: 'Node Divergence Alert', severity: 'high', value: '3 Nodes' },
  { id: 'c4', timestamp: '10:44:20', event: 'Massive Short Position', severity: 'medium', value: '$1.2M Open' },
  { id: '1', timestamp: '10:42:05', event: 'Odds Anomaly: LAL vs BOS', severity: 'high', value: '+450% Vol' },
  { id: '2', timestamp: '10:41:55', event: 'Whale Buy: $2.4M', severity: 'medium', value: 'DraftKings' },
];

const LiveFeed: React.FC = () => {
  const { mode } = useSimulation();
  const feed = mode === 'SAFE' ? FEED_SAFE : FEED_CRITICAL;

  return (
    <GlassCard title="Live Integrity Feed" icon={<Signal className="w-4 h-4" />} className="h-full min-h-[400px]" delay={0.1}>
      <div className="space-y-4">
        {feed.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-1.5 h-1.5 rounded-full ${
                item.severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse' :
                item.severity === 'medium' ? 'bg-amber-400' : 'bg-slate-500'
              }`} />
              <div>
                <p className={`text-sm font-medium group-hover:text-indigo-400 transition-colors ${
                    item.severity === 'high' ? 'text-red-200' : 'text-slate-200'
                }`}>
                  {item.event}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">{item.timestamp} UTC</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-xs font-mono font-bold ${
                 item.severity === 'high' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {item.value}
              </span>
              {item.severity === 'high' && <AlertTriangle className="w-3 h-3 text-red-500 mt-1" />}
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
    </GlassCard>
  );
};

export default LiveFeed;