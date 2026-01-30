import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Signal } from '@/types';
import { formatDateTime } from '@/utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RealTimeChartProps {
  data: Signal[];
}

export default function RealTimeChart({ data }: RealTimeChartProps) {
  const chartData = useMemo(() => {
    // Take the last 20 data points and reverse to show chronologically
    const recentData = data.slice(0, 20).reverse();

    return {
      labels: recentData.map(s => formatDateTime(s.timestamp)),
      datasets: [
        {
          label: 'Rigging Index',
          data: recentData.map(s => s.riggingIndex),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        },
        {
          label: 'Anomaly Score',
          data: recentData.map(s => s.anomalyScore),
          borderColor: 'rgb(234, 179, 8)',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#cbd5e1',
          font: {
            size: 12,
            family: 'Inter'
          },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(2);
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#334155',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        min: 0,
        max: 1,
        grid: {
          color: '#334155',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value.toFixed(1);
          }
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Real-Time Signal Monitoring</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Last {data.slice(0, 20).length} signals
          </span>
          <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse-slow" />
        </div>
      </div>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
