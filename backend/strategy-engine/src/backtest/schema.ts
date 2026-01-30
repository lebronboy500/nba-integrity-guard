/**
 * Database schema migrations
 */

export const BACKTEST_TABLES_SQL = `
-- Signal ground truth table for training data
CREATE TABLE IF NOT EXISTS signal_ground_truth (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  signal_timestamp TIMESTAMP NOT NULL,

  -- Signal features
  rigging_index DECIMAL(5,4),
  anomaly_score DECIMAL(5,4),
  tweet_count INTEGER,
  avg_sentiment DECIMAL(5,4),
  spread_bps INTEGER,
  liquidity BIGINT,

  -- Labels
  actual_outcome VARCHAR(20), -- 'rigged', 'clean', 'uncertain'
  should_have_traded BOOLEAN,
  profit_if_traded DECIMAL(10,2),

  -- Metadata
  labeled_by VARCHAR(50),
  labeled_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,

  UNIQUE(game_id, signal_timestamp)
);

CREATE INDEX IF NOT EXISTS idx_ground_truth_game ON signal_ground_truth(game_id);
CREATE INDEX IF NOT EXISTS idx_ground_truth_labeled ON signal_ground_truth(labeled_at);

-- Backtest results table
CREATE TABLE IF NOT EXISTS backtest_results (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Configuration
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  initial_capital DECIMAL(15,2) NOT NULL,
  max_position_size DECIMAL(15,2),
  risk_per_trade DECIMAL(5,4),
  rigging_threshold DECIMAL(5,4),
  anomaly_threshold DECIMAL(5,4),

  -- Results
  total_return DECIMAL(15,2),
  total_return_percent DECIMAL(10,2),
  win_rate DECIMAL(5,3),
  sharpe_ratio DECIMAL(8,2),
  max_drawdown DECIMAL(15,2),
  max_drawdown_percent DECIMAL(10,2),
  profit_factor DECIMAL(8,2),

  -- Trade statistics
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  avg_profit_per_trade DECIMAL(15,2),
  consecutive_wins INTEGER,
  consecutive_losses INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  run_by VARCHAR(50),

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_backtest_created ON backtest_results(created_at);
CREATE INDEX IF NOT EXISTS idx_backtest_name ON backtest_results(name);

-- Backtest trades table
CREATE TABLE IF NOT EXISTS backtest_trades (
  id SERIAL PRIMARY KEY,
  backtest_id INTEGER NOT NULL REFERENCES backtest_results(id) ON DELETE CASCADE,

  -- Trade details
  trade_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  game_id VARCHAR(100) NOT NULL,
  action VARCHAR(20), -- 'BET_YES' or 'BET_NO'

  -- Financial
  amount DECIMAL(15,2),
  entry_price DECIMAL(15,2),
  exit_price DECIMAL(15,2),
  profit DECIMAL(15,2),

  reason TEXT,

  UNIQUE(backtest_id, trade_id)
);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_game ON backtest_trades(game_id);

-- ML model metadata table
CREATE TABLE IF NOT EXISTS ml_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  model_type VARCHAR(50), -- 'adaptive_threshold', 'random_forest', etc
  version INTEGER,

  -- Model info
  training_samples INTEGER,
  accuracy DECIMAL(5,3),
  last_trained TIMESTAMP,

  -- Configuration
  config JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(model_type);
`;

export async function initializeBacktestTables(db: any): Promise<void> {
  try {
    console.log('[Database] Initializing backtest tables...');
    await db.query(BACKTEST_TABLES_SQL);
    console.log('[Database] Backtest tables initialized successfully');
  } catch (error) {
    console.error('[Database] Error initializing backtest tables:', error);
    throw error;
  }
}
