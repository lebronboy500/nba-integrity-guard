import React from 'react';
import { Terminal, CheckCircle2, Clock, XCircle, MoreHorizontal } from 'lucide-react';
import GlassCard from './GlassCard';
import { LogItem } from '../types';

const MOCK_LOGS: LogItem[] = [
  { id: '1', timestamp: '10:42:01', action: 'Block Malicious Tx', hash: '0x8a...3f12', status: 'success' },
  { id: '2', timestamp: '10:41:48', action: 'Flag Account: 0x4d2..', hash: '0x1b...9c99', status: 'pending' },
  { id: '3', timestamp: '10:41:12', action: 'Oracle Update', hash: '0x7e...22a1', status: 'success' },
  { id: '4', timestamp: '10:39:55', action: 'Smart Contract Call', hash: '0x2c...11b2', status: 'failed' },
  { id: '5', timestamp: '10:38:20', action: 'Verify Node Sync', hash: 'System', status: 'success' },
  { id: '6', timestamp: '10:35:10', action: 'Liquidity Check', hash: 'Pool A', status: 'success' },
  { id: '7', timestamp: '10:32:45', action: 'API Rate Limit', hash: 'Client 4', status: 'failed' },
  { id: '8', timestamp: '10:30:00', action: 'Scheduled Snapshot', hash: 'DB_Main', status: 'success' },
];

const ExecutionLog: React.FC = () => {
  return (
    <GlassCard title="Execution Log" icon={<Terminal className="w-4 h-4" />} className="h-full min-h-[400px]" delay={0.6}>
      <div className="font-mono text-xs space-y-1">
        {MOCK_LOGS.map((log) => (
          <div key={log.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors border border-transparent hover:border-white/5">
            <div className="w-4 shrink-0 flex justify-center">
              {log.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80" />}
              {log.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-500/80 animate-pulse" />}
              {log.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500/80" />}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-slate-300 font-semibold truncate">{log.action}</span>
                <span className="text-[10px] text-slate-600">{log.timestamp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1 rounded">TX</span>
                <span className="text-[10px] text-slate-500 truncate">{log.hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 flex justify-center">
        <button className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
          <MoreHorizontal className="w-3 h-3" />
          <span>Load older logs</span>
        </button>
      </div>
    </GlassCard>
  );
};

export default ExecutionLog;