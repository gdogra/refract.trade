-- Refract.trade Database Setup for Supabase
-- Run this script in your Supabase SQL editor to set up all tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  avatar TEXT,
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'elite')),
  subscription_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  risk_tolerance TEXT DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  trading_goals TEXT[] DEFAULT '{}',
  dashboard_layout JSONB,
  notification_settings JSONB,
  trading_hours JSONB,
  date_of_birth DATE,
  phone_number TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table (broker accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('margin', 'cash', 'ira')),
  is_active BOOLEAN DEFAULT TRUE,
  cash_balance DECIMAL(15,2) DEFAULT 0,
  buying_power DECIMAL(15,2) DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  api_credentials JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_number, broker)
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL,
  exit_date TIMESTAMPTZ,
  entry_price DECIMAL(10,4) NOT NULL,
  exit_price DECIMAL(10,4),
  unrealized_pnl DECIMAL(15,2),
  realized_pnl DECIMAL(15,2),
  delta DECIMAL(8,6),
  gamma DECIMAL(8,6),
  theta DECIMAL(8,6),
  vega DECIMAL(8,6),
  ai_score DECIMAL(5,3),
  ai_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position legs table (for complex strategies)
CREATE TABLE IF NOT EXISTS position_legs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  option_type TEXT CHECK (option_type IN ('call', 'put')),
  strike DECIMAL(10,2) NOT NULL,
  expiry DATE NOT NULL,
  quantity INTEGER NOT NULL,
  side TEXT CHECK (side IN ('buy', 'sell')),
  entry_price DECIMAL(8,4) NOT NULL,
  exit_price DECIMAL(8,4),
  delta DECIMAL(8,6),
  gamma DECIMAL(8,6),
  theta DECIMAL(8,6),
  vega DECIMAL(8,6),
  iv DECIMAL(6,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('buy', 'sell', 'exercise', 'assignment')),
  symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,4) NOT NULL,
  fees DECIMAL(10,2) DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL,
  wash_sale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL,
  parameters JSONB NOT NULL,
  backtest_data JSONB,
  success_rate DECIMAL(5,2),
  avg_return DECIMAL(8,4),
  max_drawdown DECIMAL(8,4),
  sharpe_ratio DECIMAL(6,3),
  ai_score DECIMAL(5,3),
  is_public BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio snapshots table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  total_delta DECIMAL(10,4) NOT NULL,
  total_gamma DECIMAL(10,4) NOT NULL,
  total_theta DECIMAL(10,4) NOT NULL,
  total_vega DECIMAL(10,4) NOT NULL,
  stress_tests JSONB,
  var95 DECIMAL(15,2),
  var99 DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk alerts table
CREATE TABLE IF NOT EXISTS risk_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('position_risk', 'portfolio_risk', 'market_event')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax records table
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  quantity DECIMAL(15,6) NOT NULL,
  cost_basis DECIMAL(15,2) NOT NULL,
  date_acquired DATE NOT NULL,
  date_sold DATE,
  sale_price DECIMAL(15,2),
  is_short_term BOOLEAN,
  is_wash_sale BOOLEAN DEFAULT FALSE,
  harvestable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wash sales table
CREATE TABLE IF NOT EXISTS wash_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  loss_date DATE NOT NULL,
  loss_amount DECIMAL(15,2) NOT NULL,
  wash_period_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning progress table
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  weaknesses TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  last_accessed TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Community profiles table
CREATE TABLE IF NOT EXISTS community_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  success_rate DECIMAL(5,2),
  avg_return DECIMAL(8,4),
  risk_adj_return DECIMAL(8,4),
  total_trades INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 0,
  contributions INTEGER DEFAULT 0,
  share_performance BOOLEAN DEFAULT FALSE,
  share_strategies BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Options chain cache table
CREATE TABLE IF NOT EXISTS option_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  expiry DATE NOT NULL,
  strike DECIMAL(10,2) NOT NULL,
  option_type TEXT CHECK (option_type IN ('call', 'put')),
  bid DECIMAL(8,4),
  ask DECIMAL(8,4),
  last_price DECIMAL(8,4),
  volume INTEGER,
  open_interest INTEGER,
  delta DECIMAL(8,6),
  gamma DECIMAL(8,6),
  theta DECIMAL(8,6),
  vega DECIMAL(8,6),
  rho DECIMAL(8,6),
  implied_volatility DECIMAL(6,4),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, expiry, strike, option_type)
);

-- Market data cache table
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  price DECIMAL(10,4) NOT NULL,
  change DECIMAL(10,4) NOT NULL,
  change_percent DECIMAL(6,3) NOT NULL,
  volume BIGINT,
  beta DECIMAL(6,3),
  market_cap BIGINT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, timestamp)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_active ON positions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON risk_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_unread ON risk_alerts(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_tax_records_user_year ON tax_records(user_id, year);
CREATE INDEX IF NOT EXISTS idx_option_chains_symbol_expiry ON option_chains(symbol, expiry);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_position_id ON transactions(position_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_timestamp ON portfolio_snapshots(user_id, timestamp);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own user_profile" ON user_profiles FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own accounts" ON accounts FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own positions" ON positions FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own position_legs" ON position_legs FOR ALL USING (
  position_id IN (SELECT id FROM positions WHERE user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can view own transactions" ON transactions FOR ALL USING (
  position_id IN (SELECT id FROM positions WHERE user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can view own strategies" ON strategies FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view public strategies" ON strategies FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Users can view own portfolio_snapshots" ON portfolio_snapshots FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own risk_alerts" ON risk_alerts FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own tax_records" ON tax_records FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own wash_sales" ON wash_sales FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own learning_progress" ON learning_progress FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own community_profile" ON community_profiles FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Anyone can view public community_profiles" ON community_profiles FOR SELECT USING (share_performance = TRUE);

-- Market data tables are public (read-only for authenticated users)
CREATE POLICY "Authenticated users can view option_chains" ON option_chains FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can view market_data" ON market_data FOR SELECT TO authenticated USING (TRUE);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_position_legs_updated_at BEFORE UPDATE ON position_legs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_records_updated_at BEFORE UPDATE ON tax_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_profiles_updated_at BEFORE UPDATE ON community_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();