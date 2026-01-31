/**
 * Database Schema for User Authentication System
 */

export const USER_TABLES_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,

  -- Authentication
  password_hash VARCHAR(255),
  wallet_address VARCHAR(255) UNIQUE,

  -- Profile
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,

  -- Settings
  theme VARCHAR(20) DEFAULT 'dark',
  language VARCHAR(10) DEFAULT 'en',
  notification_settings JSONB DEFAULT '{"email": true, "telegram": false, "discord": false}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  ip_address VARCHAR(50),
  user_agent TEXT,

  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh ON sessions(refresh_token);

-- User strategies table
CREATE TABLE IF NOT EXISTS user_strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Parameters
  rigging_threshold DECIMAL(5,4) DEFAULT 0.65,
  anomaly_threshold DECIMAL(5,4) DEFAULT 0.75,
  max_position_size DECIMAL(15,2) DEFAULT 1000.00,
  risk_per_trade DECIMAL(5,4) DEFAULT 0.02,

  -- Status
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_strategies_user ON user_strategies(user_id);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_name VARCHAR(255),

  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,  -- 'signal', 'trade', 'profit', 'alert'
  title VARCHAR(255) NOT NULL,
  message TEXT,

  data JSONB DEFAULT '{}',

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,

  email_subject VARCHAR(255),
  email_body TEXT,
  telegram_message TEXT,
  discord_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add user_id to existing tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'trades' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE trades ADD COLUMN user_id INTEGER REFERENCES users(id);
      CREATE INDEX idx_trades_user ON trades(user_id);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signal_logs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'signal_logs' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE signal_logs ADD COLUMN user_id INTEGER REFERENCES users(id);
      CREATE INDEX idx_signal_logs_user ON signal_logs(user_id);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backtest_results') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'backtest_results' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE backtest_results ADD COLUMN user_id INTEGER REFERENCES users(id);
      CREATE INDEX idx_backtest_results_user ON backtest_results(user_id);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'distributions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'distributions' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE distributions ADD COLUMN user_id INTEGER REFERENCES users(id);
      CREATE INDEX idx_distributions_user ON distributions(user_id);
    END IF;
  END IF;
END $$;
`;

export async function initializeUserTables(db: any): Promise<void> {
  try {
    console.log('[Database] Initializing user tables...');
    await db.query(USER_TABLES_SQL);
    console.log('[Database] User tables initialized successfully');
  } catch (error) {
    console.error('[Database] Error initializing user tables:', error);
    throw error;
  }
}
