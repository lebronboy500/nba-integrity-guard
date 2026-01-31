-- ============================================================================
-- Payment Service Schema - ERC-7962 Privacy Payment
-- Week 7: Privacy Payment System
-- ============================================================================

-- Privacy Addresses (One-Time Public Keys)
CREATE TABLE IF NOT EXISTS privacy_addresses (
  id SERIAL PRIMARY KEY,
  one_time_address VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  purpose VARCHAR(100) NOT NULL,
  tx_hash VARCHAR(255),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_privacy_addresses_expires_at ON privacy_addresses(expires_at);
CREATE INDEX idx_privacy_addresses_used ON privacy_addresses(used);

-- Payment Records (Privacy-Preserving)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  trader_address VARCHAR(255),
  amount VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  one_time_address VARCHAR(255) UNIQUE,
  tx_hash VARCHAR(255),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_purpose ON payments(purpose);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Rewards (Anonymous Reward Distribution)
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  trader_address VARCHAR(255) NOT NULL,
  amount VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  one_time_address VARCHAR(255) UNIQUE,
  tx_hash VARCHAR(255),
  description TEXT,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_trader_address ON rewards(trader_address);
CREATE INDEX idx_rewards_status ON rewards(status);
CREATE INDEX idx_rewards_reason ON rewards(reason);
CREATE INDEX idx_rewards_created_at ON rewards(created_at);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- days
  price VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO subscription_plans (name, duration, price, currency, features, active)
VALUES
  ('Starter', 30, '49', 'USDC', '["Basic Analytics", "API Access (1K calls/month)", "Email Support"]', true),
  ('Pro', 30, '149', 'USDC', '["Advanced Analytics", "API Access (10K calls/month)", "Priority Support", "Custom Reports"]', true),
  ('Enterprise', 30, '499', 'USDC', '["Premium Analytics", "Unlimited API Access", "24/7 Support", "Dedicated Account Manager", "Custom Integrations"]', true)
ON CONFLICT DO NOTHING;

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  payment_id INTEGER REFERENCES payments(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(end_date);

-- API Usage Charges (for billing)
CREATE TABLE IF NOT EXISTS api_usage_charges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  api_calls INTEGER NOT NULL,
  cost VARCHAR(255) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_usage_charges_user_id ON api_usage_charges(user_id);
CREATE INDEX idx_api_usage_charges_recorded_at ON api_usage_charges(recorded_at);

-- Service Fee Configuration
CREATE TABLE IF NOT EXISTS service_fee_config (
  id SERIAL PRIMARY KEY,
  api_call_fee VARCHAR(255) NOT NULL, -- per 1000 calls
  data_access_fee VARCHAR(255) NOT NULL, -- per month
  advanced_analytics_fee VARCHAR(255) NOT NULL, -- per query
  currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO service_fee_config (api_call_fee, data_access_fee, advanced_analytics_fee, currency, active)
VALUES ('0.001', '9.99', '0.1', 'USDC', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Comments for clarity
-- ============================================================================

COMMENT ON TABLE privacy_addresses IS 'ERC-7962 one-time public key addresses for payment privacy';
COMMENT ON TABLE payments IS 'Payment records - user identity not exposed on-chain';
COMMENT ON TABLE rewards IS 'Anonymous reward distribution to traders';
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers';
COMMENT ON TABLE user_subscriptions IS 'User subscription status and tracking';
COMMENT ON TABLE api_usage_charges IS 'API usage billing records';
COMMENT ON TABLE service_fee_config IS 'Service fee pricing configuration';

COMMENT ON COLUMN privacy_addresses.one_time_address IS 'One-time public key address (ERC-7962)';
COMMENT ON COLUMN privacy_addresses.used IS 'Whether this address has received a payment';
COMMENT ON COLUMN payments.user_id IS 'User ID (not exposed to blockchain)';
COMMENT ON COLUMN payments.one_time_address IS 'Privacy address used for this payment';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, completed, failed, expired';
COMMENT ON COLUMN payments.metadata IS 'Additional payment metadata (JSON)';
COMMENT ON COLUMN rewards.trader_address IS 'Trader wallet address (hidden from payment origin)';
COMMENT ON COLUMN rewards.claimed IS 'Whether the trader has claimed the reward';
COMMENT ON COLUMN user_subscriptions.status IS 'Subscription status: active, expired, cancelled';
