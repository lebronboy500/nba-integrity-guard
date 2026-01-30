import React from 'react';

type Page = 'dashboard' | 'trading' | 'analytics' | 'settings';

interface HeaderProps {
  isConnected: boolean;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export default function Header({ isConnected, currentPage, onPageChange }: HeaderProps) {
  return (
    <header className="border-b border-dark-border/50 sticky top-0 z-50 bg-dark-surface/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏀</span>
            <div>
              <h1 className="text-lg font-bold">NBA Integrity Guard</h1>
            </div>
          </div>

          {/* Navigation and Status */}
          <div className="flex items-center gap-6">
            {/* Navigation */}
            <nav className="flex items-center gap-0.5">
              <NavButton
                active={currentPage === 'dashboard'}
                onClick={() => onPageChange('dashboard')}
              >
                Dashboard
              </NavButton>
              <NavButton
                active={currentPage === 'trading'}
                onClick={() => onPageChange('trading')}
              >
                Trading
              </NavButton>
              <NavButton
                active={currentPage === 'analytics'}
                onClick={() => onPageChange('analytics')}
              >
                Analytics
              </NavButton>
              <NavButton
                active={currentPage === 'settings'}
                onClick={() => onPageChange('settings')}
              >
                Settings
              </NavButton>
            </nav>

            {/* Connection Status */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-primary-500' : 'bg-danger-500'
                }`}
              />
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavButton({
  children,
  active = false,
  onClick
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
        active
          ? 'border-primary-500 text-primary-400'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
