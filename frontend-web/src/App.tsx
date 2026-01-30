import React, { useEffect, useState } from 'react';
import DashboardPage from './components/Dashboard/DashboardPage';
import TradingPage from './components/Trading/TradingPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import SettingsPage from './components/Settings/SettingsPage';
import Header from './components/Dashboard/Header';
import { ToastProvider } from './components/Toast/ToastProvider';
import { useWebSocket } from './hooks/useWebSocket';
import { useMockData } from './hooks/useMockData';
import { useSignalStore } from './store/signalStore';
import { useStatsStore } from './store/statsStore';

type Page = 'dashboard' | 'trading' | 'analytics' | 'settings';

// Use mock data for local development (no backend required)
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { addSignal } = useSignalStore();
  const { updateStats } = useStatsStore();

  // Load mock data for local testing
  useMockData(USE_MOCK_DATA);

  // Connect to WebSocket only if not using mock data
  const { isConnected } = useWebSocket({
    url: USE_MOCK_DATA ? '' : 'ws://localhost:3000', // Empty URL skips connection
    autoReconnect: !USE_MOCK_DATA,
    onMessage: (data) => {
      if (USE_MOCK_DATA) return; // Ignore if using mock data

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

  // Fetch initial stats on mount (only if not using mock data)
  useEffect(() => {
    if (USE_MOCK_DATA) return;

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
    <ToastProvider>
      <div className="min-h-screen bg-dark-bg">
        {/* Mock Data Banner */}
        {USE_MOCK_DATA && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-2">
            <p className="text-center text-sm text-yellow-400">
              🧪 <strong>Mock Data Mode</strong> - Using simulated data for testing. Set VITE_USE_MOCK_DATA=false to connect to backend.
            </p>
          </div>
        )}

        <Header
          isConnected={USE_MOCK_DATA ? true : isConnected}
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
    </ToastProvider>
  );
}

export default App;
