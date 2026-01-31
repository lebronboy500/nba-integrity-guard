import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import Portfolio from './pages/Portfolio';
import Reputation from './pages/Reputation';
import Analytics from './pages/Analytics';

type Page = 'dashboard' | 'strategies' | 'portfolio' | 'reputation' | 'analytics';

const NewApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'strategies':
        return <Strategies />;
      case 'portfolio':
        return <Portfolio />;
      case 'reputation':
        return <Reputation />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.02]" />

        {/* Ambient Glows */}
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full blur-[128px] bg-indigo-500/10 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[10%] w-[400px] h-[400px] rounded-full blur-[128px] bg-purple-500/10 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Page Content */}
      <main className="relative z-10">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/5 bg-black/40 backdrop-blur-xl text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2025 NBA Integrity Guard. Polygon Amoy Testnet.</p>
          <p className="mt-1">A Web3 integrity monitoring and automated hedging system for NBA games.</p>
        </div>
      </footer>
    </div>
  );
};

export default NewApp;
