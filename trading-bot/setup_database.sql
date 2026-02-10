-- Database setup for Trading Bot logging
-- Run this script to create the database and tables

CREATE DATABASE trading_bot;
\c trading_bot;

-- Create tables (these will also be created automatically by the bot)
-- But you can run this for manual setup

CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(4) NOT NULL,
    qty INTEGER NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    price DECIMAL(10,2),
    stop_price DECIMAL(10,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_decisions (
    id SERIAL PRIMARY KEY,
    signal_id INTEGER,
    decision VARCHAR(20) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    signal_id INTEGER,
    broker_order_id VARCHAR(100),
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(4) NOT NULL,
    qty INTEGER NOT NULL,
    status VARCHAR(20),
    filled_qty INTEGER DEFAULT 0,
    filled_price DECIMAL(10,4),
    timestamp TIMESTAMP NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_states (
    id SERIAL PRIMARY KEY,
    equity DECIMAL(12,2) NOT NULL,
    buying_power DECIMAL(12,2) NOT NULL,
    cash DECIMAL(12,2),
    portfolio_value DECIMAL(12,2),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signals_symbol_timestamp ON trading_signals(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_orders_symbol_timestamp ON orders(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON system_events(event_type, timestamp);