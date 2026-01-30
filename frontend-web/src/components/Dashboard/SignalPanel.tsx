import React from 'react';
import { Signal } from '@/types';
import { formatRelativeTime, getRiggingColor, getAnomalyColor } from '@/utils/format';

interface SignalPanelProps {
  signals: Signal[];
}

export default function SignalPanel({ signals }: SignalPanelProps) {
  const activeSignal = signals.find(s => s.status === 'active');

  if (!activeSignal && signals.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-dark-hover flex items-center justify-center mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Signals</h3>
          <p className="text-slate-400 text-sm max-w-md">
            The system is monitoring Twitter and Polymarket for suspicious activity.
            You'll be notified when a high-risk signal is detected.
          </p>
        </div>
      </div>
    );
  }

  if (activeSignal) {
    return (
      <div className="card border-2 border-danger-500/30 bg-danger-500/5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-danger-500/20 flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-danger-400">
                HIGH RISK SIGNAL ACTIVE
              </h3>
              <p className="text-sm text-slate-400">
                Game: {activeSignal.gameId}
              </p>
            </div>
          </div>
          <span className="badge-danger">ACTIVE</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricItem
            label="Rigging Index"
            value={activeSignal.riggingIndex.toFixed(2)}
            color={getRiggingColor(activeSignal.riggingIndex)}
          />
          <MetricItem
            label="Anomaly Score"
            value={activeSignal.anomalyScore.toFixed(2)}
            color={getAnomalyColor(activeSignal.anomalyScore)}
          />
          <MetricItem
            label="Tweet Volume"
            value={activeSignal.tweetCount.toString()}
            color="text-slate-300"
          />
          <MetricItem
            label="Confidence"
            value={`${((activeSignal.confidence || 0) * 100).toFixed(0)}%`}
            color="text-primary-400"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-dark-border">
          <span className="text-xs text-slate-500">
            Detected {formatRelativeTime(activeSignal.timestamp)}
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm">View Details</button>
            <button className="btn-primary text-sm">Execute Trade</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Recent Signals</h3>
      <div className="space-y-2">
        {signals.slice(0, 5).map((signal) => (
          <SignalItem key={signal.timestamp} signal={signal} />
        ))}
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  color
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SignalItem({ signal }: { signal: Signal }) {
  const statusClass =
    signal.status === 'executed'
      ? 'badge-success'
      : signal.status === 'expired'
      ? 'badge-neutral'
      : 'badge-warning';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-dark-hover">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{signal.gameId}</span>
          <span className={statusClass}>{signal.status}</span>
        </div>
        <p className="text-xs text-slate-500">
          {formatRelativeTime(signal.timestamp)}
        </p>
      </div>
      <div className="flex gap-4 text-right">
        <div>
          <p className="text-xs text-slate-500">Rigging</p>
          <p className={`text-sm font-semibold ${getRiggingColor(signal.riggingIndex)}`}>
            {signal.riggingIndex.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Anomaly</p>
          <p className={`text-sm font-semibold ${getAnomalyColor(signal.anomalyScore)}`}>
            {signal.anomalyScore.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
