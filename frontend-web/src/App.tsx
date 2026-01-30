import React, { useEffect, useState } from 'react';
import DashboardPage from './components/Dashboard/DashboardPage';
import TradingPage from './components/Trading/TradingPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import SettingsPage from './components/Settings/SettingsPage';
import Header from './components/Dashboard/Header';
import { useWebSocket } from './hooks/useWebSocket';
import { useSignalStore } from './store/signalStore';
import { useStatsStore } from './store/statsStore';

type Page = 'dashboard' | 'trading' | 'analytics' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { signals, addSignal } = useSignalStore();
  const { stats, updateStats } = useStatsStore();

  const { isConnected } = useWebSocket({
    url: 'ws://localhost:3000',
    onMessage: (data) => {
      console.log('[App] WebSocket message received:', data);

      // Handle different message types
      if (data.type === 'signal') {
        addSignal(data.payload);
      } else if (data.type === 'stats') {
        updateStats(data.payload);
      }
    },
    onOpen: () => {
      console.log('[App] WebSocket connected');
    },
    onClose: () => {
      console.log('[App] WebSocket disconnected');
    }
  });

  // Fetch initial stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/stats');
        const data = await response.json();
        updateStats(data);
      } catch (error) {
        console.error('[App] Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [updateStats]);

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header
        isConnected={isConnected}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <main className="container mx-auto px-6 py-8">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'trading' && <TradingPage />}
        {currentPage === 'analytics' && <AnalyticsPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>© 2025 NBA Integrity Guard. All rights reserved.</p>
            <p>Powered by Web3 & Machine Learning</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
