import React, { useState, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useTradeStore } from '@/store/tradeStore';
import { formatCurrency, formatPercentage } from '@/utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsPage() {
  const { trades } = useTradeStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calculate metrics
  const metrics = useMemo(() => {
    const completedTrades = trades.filter(t => t.status === 'COMPLETED');
    const profitableTrades = completedTrades.filter(t => (t.profit || 0) > 0);

    const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalInvested = completedTrades.reduce((sum, t) => sum + t.amount, 0);
    const winRate = completedTrades.length > 0
      ? profitableTrades.length / completedTrades.length
      : 0;
    const roi = totalInvested > 0 ? totalProfit / totalInvested : 0;

    // Calculate average profit per trade
    const avgProfit = completedTrades.length > 0
      ? totalProfit / completedTrades.length
      : 0;

    // Calculate max consecutive wins/losses
    let maxWins = 0, maxLosses = 0;
    let currentWins = 0, currentLosses = 0;

    completedTrades.forEach(trade => {
      if ((trade.profit || 0) > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    });

    return {
      totalTrades: completedTrades.length,
      totalProfit,
      totalInvested,
      winRate,
      roi,
      avgProfit,
      maxWins,
      maxLosses,
      profitableTrades: profitableTrades.length,
      losingTrades: completedTrades.length - profitableTrades.length
    };
  }, [trades]);

  // Equity curve data
  const equityCurveData = useMemo(() => {
    const completedTrades = trades
      .filter(t => t.status === 'COMPLETED')
      .sort((a, b) => new Date(a.completedAt || a.createdAt).getTime() -
                      new Date(b.completedAt || b.createdAt).getTime());

    let equity = 0;
    const equityPoints = completedTrades.map(trade => {
      equity += (trade.profit || 0);
      return {
        date: new Date(trade.completedAt || trade.createdAt).toLocaleDateString(),
        equity
      };
    });

    return {
      labels: equityPoints.map(p => p.date),
      datasets: [{
        label: 'Equity',
        data: equityPoints.map(p => p.equity),
        borderColor: equity >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)',
        backgroundColor: equity >= 0
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2
      }]
    };
  }, [trades]);

  // Win/Loss distribution
  const winLossData = useMemo(() => {
    return {
      labels: ['Wins', 'Losses'],
      datasets: [{
        data: [metrics.profitableTrades, metrics.losingTrades],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }]
    };
  }, [metrics]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#cbd5e1',
          font: { size: 12, family: 'Inter' }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { color: '#334155', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        grid: { color: '#334155', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-slate-400">
            Performance metrics and insights
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <TimeRangeButton
            active={timeRange === '7d'}
            onClick={() => setTimeRange('7d')}
          >
            7D
          </TimeRangeButton>
          <TimeRangeButton
            active={timeRange === '30d'}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </TimeRangeButton>
          <TimeRangeButton
            active={timeRange === '90d'}
            onClick={() => setTimeRange('90d')}
          >
            90D
          </TimeRangeButton>
          <TimeRangeButton
            active={timeRange === 'all'}
            onClick={() => setTimeRange('all')}
          >
            All
          </TimeRangeButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Profit"
          value={formatCurrency(metrics.totalProfit)}
          subtitle={`From ${metrics.totalTrades} trades`}
          color={metrics.totalProfit >= 0 ? 'text-primary-400' : 'text-danger-400'}
        />
        <MetricCard
          title="Win Rate"
          value={formatPercentage(metrics.winRate)}
          subtitle={`${metrics.profitableTrades}W / ${metrics.losingTrades}L`}
          color={metrics.winRate >= 0.6 ? 'text-primary-400' : 'text-yellow-400'}
        />
        <MetricCard
          title="ROI"
          value={formatPercentage(metrics.roi)}
          subtitle={`Invested: ${formatCurrency(metrics.totalInvested)}`}
          color={metrics.roi >= 0 ? 'text-primary-400' : 'text-danger-400'}
        />
        <MetricCard
          title="Avg Profit/Trade"
          value={formatCurrency(metrics.avgProfit)}
          subtitle={`Best streak: ${metrics.maxWins} wins`}
          color={metrics.avgProfit >= 0 ? 'text-primary-400' : 'text-danger-400'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
          <div className="h-80">
            <Line data={equityCurveData} options={chartOptions} />
          </div>
        </div>

        {/* Win/Loss Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Win/Loss Distribution</h3>
          <div className="h-80">
            <Bar
              data={winLossData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Performance Details */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Performance Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DetailRow label="Total Trades" value={metrics.totalTrades.toString()} />
          <DetailRow label="Winning Trades" value={metrics.profitableTrades.toString()} />
          <DetailRow label="Losing Trades" value={metrics.losingTrades.toString()} />
          <DetailRow label="Max Consecutive Wins" value={metrics.maxWins.toString()} />
          <DetailRow label="Max Consecutive Losses" value={metrics.maxLosses.toString()} />
          <DetailRow label="Total Invested" value={formatCurrency(metrics.totalInvested)} />
        </div>
      </div>

      {/* Backtest Results (Placeholder) */}
      <div className="card border-2 border-primary-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📊</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Backtest Results</h3>
            <p className="text-slate-400 text-sm mb-4">
              Run historical backtests to validate your strategy performance
            </p>
            <button className="btn-primary text-sm">
              Run Backtest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeRangeButton({
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

function MetricCard({
  title,
  value,
  subtitle,
  color
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="card">
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <p className={`text-3xl font-bold mb-1 ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-dark-border last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  );
}
