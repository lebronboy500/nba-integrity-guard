import React from 'react';

interface HeaderProps {
  isConnected: boolean;
}

export default function Header({ isConnected }: HeaderProps) {
  return (
    <header className="border-b border-dark-border glass sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-xl font-bold">🏀</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">
                  NBA Integrity Guard
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time game integrity monitoring
                </p>
              </div>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center gap-6">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? 'bg-primary-500 animate-pulse'
                    : 'bg-danger-500'
                }`}
              />
              <span className={`text-sm font-medium ${
                isConnected ? 'text-primary-400' : 'text-danger-400'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <NavButton active>Dashboard</NavButton>
              <NavButton>Trades</NavButton>
              <NavButton>Analytics</NavButton>
              <NavButton>Settings</NavButton>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavButton({
  children,
  active = false
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
      }`}
    >
      {children}
    </button>
  );
}
