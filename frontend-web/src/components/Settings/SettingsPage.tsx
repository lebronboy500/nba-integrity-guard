import React, { useState } from 'react';

interface SettingsState {
  riggingThreshold: number;
  anomalyThreshold: number;
  maxPositionSize: number;
  riskPerTrade: number;
  autoTrade: boolean;
  notifications: {
    email: boolean;
    telegram: boolean;
    discord: boolean;
  };
  email: string;
  telegramId: string;
  discordWebhook: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    riggingThreshold: 0.65,
    anomalyThreshold: 0.75,
    maxPositionSize: 1000,
    riskPerTrade: 0.02,
    autoTrade: false,
    notifications: {
      email: true,
      telegram: false,
      discord: false
    },
    email: '',
    telegramId: '',
    discordWebhook: ''
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production, this would call an API
    console.log('[Settings] Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        riggingThreshold: 0.65,
        anomalyThreshold: 0.75,
        maxPositionSize: 1000,
        riskPerTrade: 0.02,
        autoTrade: false,
        notifications: {
          email: true,
          telegram: false,
          discord: false
        },
        email: '',
        telegramId: '',
        discordWebhook: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">
          Configure your trading parameters and notifications
        </p>
      </div>

      {/* Save Status */}
      {saved && (
        <div className="card border-2 border-primary-500/30 bg-primary-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h3 className="font-semibold text-primary-400">Settings Saved</h3>
              <p className="text-sm text-slate-400">Your changes have been applied</p>
            </div>
          </div>
        </div>
      )}

      {/* Trading Parameters */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <span>⚙️</span>
          Trading Parameters
        </h2>

        <div className="space-y-6">
          {/* Rigging Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Rigging Index Threshold
              </label>
              <span className="text-sm font-mono text-primary-400">
                {settings.riggingThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings.riggingThreshold}
              onChange={(e) => setSettings({ ...settings, riggingThreshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-dark-hover rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum rigging index to trigger a signal (higher = more selective)
            </p>
          </div>

          {/* Anomaly Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Anomaly Score Threshold
              </label>
              <span className="text-sm font-mono text-primary-400">
                {settings.anomalyThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="0.95"
              step="0.05"
              value={settings.anomalyThreshold}
              onChange={(e) => setSettings({ ...settings, anomalyThreshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-dark-hover rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum anomaly score to trigger a signal (higher = more selective)
            </p>
          </div>

          {/* Max Position Size */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Max Position Size (USD)
            </label>
            <input
              type="number"
              value={settings.maxPositionSize}
              onChange={(e) => setSettings({ ...settings, maxPositionSize: parseFloat(e.target.value) })}
              className="input w-full"
              min="100"
              max="10000"
              step="100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Maximum amount per trade
            </p>
          </div>

          {/* Risk Per Trade */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Risk Per Trade
              </label>
              <span className="text-sm font-mono text-primary-400">
                {(settings.riskPerTrade * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.1"
              step="0.01"
              value={settings.riskPerTrade}
              onChange={(e) => setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) })}
              className="w-full h-2 bg-dark-hover rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-slate-500 mt-1">
              Percentage of capital to risk per trade
            </p>
          </div>

          {/* Auto Trade Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-dark-hover">
            <div>
              <h3 className="text-sm font-medium text-slate-300">Auto-Trading</h3>
              <p className="text-xs text-slate-500 mt-1">
                Automatically execute trades when signals match
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoTrade}
                onChange={(e) => setSettings({ ...settings, autoTrade: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-border rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <span>🔔</span>
          Notifications
        </h2>

        <div className="space-y-4">
          {/* Email */}
          <div className="p-4 rounded-lg bg-dark-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">📧</span>
                <div>
                  <h3 className="text-sm font-medium text-slate-300">Email Alerts</h3>
                  <p className="text-xs text-slate-500">Get notified via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-border rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            {settings.notifications.email && (
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="your@email.com"
                className="input w-full text-sm"
              />
            )}
          </div>

          {/* Telegram */}
          <div className="p-4 rounded-lg bg-dark-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">✈️</span>
                <div>
                  <h3 className="text-sm font-medium text-slate-300">Telegram</h3>
                  <p className="text-xs text-slate-500">Instant messages via Telegram bot</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.telegram}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, telegram: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-border rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            {settings.notifications.telegram && (
              <input
                type="text"
                value={settings.telegramId}
                onChange={(e) => setSettings({ ...settings, telegramId: e.target.value })}
                placeholder="Your Telegram User ID"
                className="input w-full text-sm"
              />
            )}
          </div>

          {/* Discord */}
          <div className="p-4 rounded-lg bg-dark-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <h3 className="text-sm font-medium text-slate-300">Discord</h3>
                  <p className="text-xs text-slate-500">Webhook notifications to Discord</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.discord}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, discord: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-border rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            {settings.notifications.discord && (
              <input
                type="text"
                value={settings.discordWebhook}
                onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
                placeholder="Discord Webhook URL"
                className="input w-full text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>ℹ️</span>
          System Information
        </h2>
        <div className="space-y-2 text-sm">
          <InfoRow label="Version" value="v2.0.0 (Phase 2)" />
          <InfoRow label="Backend Status" value="Connected" valueColor="text-primary-400" />
          <InfoRow label="WebSocket" value="Active" valueColor="text-primary-400" />
          <InfoRow label="Database" value="PostgreSQL 15" />
          <InfoRow label="Cache" value="Redis 7" />
          <InfoRow label="Blockchain" value="Polygon Amoy Testnet" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="btn-primary">
          Save Changes
        </button>
        <button onClick={handleReset} className="btn-secondary">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor = 'text-slate-300'
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-dark-border last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}
