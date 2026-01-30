import React, { useEffect, useState } from 'react';
import { Trade } from '@/types';
import { useTradeStore } from '@/store/tradeStore';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/utils/format';
import { apiService } from '@/services/api';
import TradeModal from './TradeModal';
import { useToast } from '@/components/Toast/ToastProvider';

export default function TradingPage() {
  const { trades, addTrade } = useTradeStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'EXECUTED' | 'COMPLETED' | 'FAILED'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'profit'>('date');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTrades(100);
      response.data.forEach(trade => addTrade(trade));
      showToast('success', 'Trades loaded successfully');
    } catch (error) {
      console.error('[TradingPage] Failed to fetch trades:', error);
      showToast('error', 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades
    .filter(trade => filter === 'all' ? true : trade.status === filter)
    .filter(trade =>
      searchQuery === '' ||
      trade.gameId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'amount':
        return b.amount - a.amount;
      case 'profit':
        return (b.profit || 0) - (a.profit || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Trading History</h1>
        <p className="text-slate-400">
          View and manage all trading activities
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="card">
        <div className="flex flex-col gap-4">
          {/* Filter Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterButton
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                All
              </FilterButton>
              <FilterButton
                active={filter === 'PENDING'}
                onClick={() => setFilter('PENDING')}
              >
                Pending
              </FilterButton>
              <FilterButton
                active={filter === 'EXECUTED'}
                onClick={() => setFilter('EXECUTED')}
              >
                Executed
              </FilterButton>
              <FilterButton
                active={filter === 'COMPLETED'}
                onClick={() => setFilter('COMPLETED')}
              >
                Completed
              </FilterButton>
              <FilterButton
                active={filter === 'FAILED'}
                onClick={() => setFilter('FAILED')}
              >
                Failed
              </FilterButton>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input text-sm"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="profit">Profit</option>
              </select>
              <button
                onClick={fetchTrades}
                className="btn-secondary text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Game ID or Trade ID..."
              className="input w-full pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Trades"
          value={trades.length}
          color="text-slate-100"
        />
        <StatCard
          label="Completed"
          value={trades.filter(t => t.status === 'COMPLETED').length}
          color="text-primary-400"
        />
        <StatCard
          label="Pending"
          value={trades.filter(t => t.status === 'PENDING').length}
          color="text-yellow-400"
        />
        <StatCard
          label="Failed"
          value={trades.filter(t => t.status === 'FAILED').length}
          color="text-danger-400"
        />
      </div>

      {/* Trades Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading trades...</p>
            </div>
          </div>
        ) : sortedTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-dark-hover flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Trades Found</h3>
            <p className="text-slate-400 text-sm">
              {filter !== 'all'
                ? `No ${filter.toLowerCase()} trades available`
                : 'Start trading to see your history here'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Game</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Action</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Est. Payout</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Profit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map((trade) => (
                  <TradeRow
                    key={trade.id}
                    trade={trade}
                    onClick={() => setSelectedTrade(trade)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <TradeModal
        trade={selectedTrade!}
        isOpen={selectedTrade !== null}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
          : 'bg-dark-hover text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TradeRow({ trade, onClick }: { trade: Trade; onClick: () => void }) {
  const getStatusBadge = (status: Trade['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge-warning">{status}</span>;
      case 'EXECUTED':
        return <span className="badge badge-blue">{status}</span>;
      case 'COMPLETED':
        return <span className="badge-success">{status}</span>;
      case 'FAILED':
        return <span className="badge-danger">{status}</span>;
      default:
        return <span className="badge-neutral">{status}</span>;
    }
  };

  const getActionColor = (action: Trade['action']) => {
    return action === 'BET_YES' ? 'text-primary-400' : 'text-danger-400';
  };

  return (
    <tr
      onClick={onClick}
      className="border-b border-dark-border hover:bg-dark-hover transition-colors cursor-pointer"
    >
      <td className="py-3 px-4">
        <span className="font-mono text-xs text-slate-400">
          {trade.id.slice(0, 8)}...
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-medium">{trade.gameId}</span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-sm font-semibold ${getActionColor(trade.action)}`}>
          {trade.action}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium">{formatCurrency(trade.amount)}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm text-slate-300">{formatCurrency(trade.estimatedPayout)}</span>
      </td>
      <td className="py-3 px-4 text-right">
        {trade.profit !== undefined ? (
          <span className={`text-sm font-semibold ${
            trade.profit > 0 ? 'text-primary-400' : 'text-danger-400'
          }`}>
            {trade.profit > 0 ? '+' : ''}{formatCurrency(trade.profit)}
          </span>
        ) : (
          <span className="text-sm text-slate-500">-</span>
        )}
      </td>
      <td className="py-3 px-4">
        {getStatusBadge(trade.status)}
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-slate-400">
          <div>{formatDateTime(trade.createdAt)}</div>
          <div className="text-xs text-slate-500">{formatRelativeTime(trade.createdAt)}</div>
        </div>
      </td>
    </tr>
  );
}
