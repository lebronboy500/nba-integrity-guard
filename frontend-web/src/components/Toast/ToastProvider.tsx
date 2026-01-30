import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  onRemove
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const configs = {
    success: {
      icon: '✓',
      bgClass: 'bg-primary-500/10 border-primary-500/20',
      iconClass: 'bg-primary-500 text-white',
      textClass: 'text-primary-400'
    },
    error: {
      icon: '✕',
      bgClass: 'bg-danger-500/10 border-danger-500/20',
      iconClass: 'bg-danger-500 text-white',
      textClass: 'text-danger-400'
    },
    warning: {
      icon: '⚠',
      bgClass: 'bg-yellow-500/10 border-yellow-500/20',
      iconClass: 'bg-yellow-500 text-white',
      textClass: 'text-yellow-400'
    },
    info: {
      icon: 'ℹ',
      bgClass: 'bg-blue-500/10 border-blue-500/20',
      iconClass: 'bg-blue-500 text-white',
      textClass: 'text-blue-400'
    }
  };

  const config = configs[toast.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgClass} backdrop-blur-sm shadow-lg animate-slide-in-right`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconClass}`}>
        <span className="text-sm font-bold">{config.icon}</span>
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${config.textClass}`}>{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
