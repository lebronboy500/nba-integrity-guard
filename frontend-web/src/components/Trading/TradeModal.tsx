import React from 'react';
import { Trade } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';

interface TradeModalProps {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
}

export default function TradeModal({ trade, isOpen, onClose }: TradeModalProps) {
  if (!isOpen) return null;

  const profitColor = (trade.profit || 0) >= 0 ? 'text-primary-400' : 'text-danger-400';
  const profitBg = (trade.profit || 0) >= 0 ? 'bg-primary-500/10' : 'bg-danger-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-surface border border-dark-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-dark-surface border-b border-dark-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Trade Details</h2>
            <p className="text-sm text-slate-400 mt-1">ID: {trade.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <StatusBadge status={trade.status} />
            <ActionBadge action={trade.action} />
          </div>

          {/* Game Info */}
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Game Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Game ID" value={trade.gameId} />
              <InfoRow label="Action" value={trade.action} />
              <InfoRow label="Created At" value={formatDateTime(trade.createdAt)} />
              {trade.completedAt && (
                <InfoRow label="Completed At" value={formatDateTime(trade.completedAt)} />
              )}
            </div>
          </div>

          {/* Financial Details */}
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Amount" value={formatCurrency(trade.amount)} />
              <InfoRow label="Estimated Payout" value={formatCurrency(trade.estimatedPayout)} />
              {trade.actualPayout !== undefined && (
                <InfoRow label="Actual Payout" value={formatCurrency(trade.actualPayout)} />
              )}
              {trade.profit !== undefined && (
                <div className="col-span-2">
                  <div className={`p-4 rounded-lg ${profitBg}`}>
                    <p className="text-sm text-slate-400 mb-1">Profit/Loss</p>
                    <p className={`text-3xl font-bold ${profitColor}`}>
                      {trade.profit >= 0 ? '+' : ''}{formatCurrency(trade.profit)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ROI: {((trade.profit / trade.amount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signal Info */}
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Signal Information</h3>
            <InfoRow label="Signal Timestamp" value={formatDateTime(trade.signalTimestamp)} />
            <p className="text-xs text-slate-500 mt-2">
              Trade executed {Math.floor((new Date(trade.createdAt).getTime() - new Date(trade.signalTimestamp).getTime()) / 60000)} minutes after signal
            </p>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Timeline</h3>
            <div className="space-y-4">
              <TimelineItem
                time={formatDateTime(trade.signalTimestamp)}
                label="Signal Detected"
                icon="🔔"
                color="blue"
              />
              <TimelineItem
                time={formatDateTime(trade.createdAt)}
                label="Trade Created"
                icon="📝"
                color="yellow"
              />
              {trade.completedAt && (
                <TimelineItem
                  time={formatDateTime(trade.completedAt)}
                  label="Trade Completed"
                  icon={trade.profit && trade.profit > 0 ? '✅' : '❌'}
                  color={trade.profit && trade.profit > 0 ? 'green' : 'red'}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-surface border-t border-dark-border px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          {trade.status === 'PENDING' && (
            <button className="btn-danger">
              Cancel Trade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Trade['status'] }) {
  const configs = {
    PENDING: { label: 'Pending', className: 'badge-warning' },
    EXECUTED: { label: 'Executed', className: 'badge badge-blue' },
    COMPLETED: { label: 'Completed', className: 'badge-success' },
    FAILED: { label: 'Failed', className: 'badge-danger' }
  };

  const config = configs[status];
  return <span className={config.className}>{config.label}</span>;
}

function ActionBadge({ action }: { action: Trade['action'] }) {
  const isYes = action === 'BET_YES';
  return (
    <span className={`badge ${isYes ? 'badge-success' : 'badge-danger'}`}>
      {action}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function TimelineItem({
  time,
  label,
  icon,
  color
}: {
  time: string;
  label: string;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    green: 'bg-primary-500/20 text-primary-400',
    red: 'bg-danger-500/20 text-danger-400'
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <span className="text-sm">{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-1">{time}</p>
      </div>
    </div>
  );
}
