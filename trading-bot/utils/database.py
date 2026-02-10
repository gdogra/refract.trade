import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional
import psycopg2
from psycopg2.extras import Json
import asyncpg

from models.trade_signal import TradeSignal


class DatabaseLogger:
    """
    Database logger for trading bot events and decisions.
    
    Logs all trading decisions, signals, orders, and system events to PostgreSQL.
    """
    
    def __init__(self):
        self.connection_pool = None
        self.logger = logging.getLogger(__name__)
        
    async def initialize(self):
        """Initialize database connection pool."""
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
            
        try:
            self.connection_pool = await asyncpg.create_pool(database_url)
            await self._create_tables()
            self.logger.info("Database connection pool initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize database: {e}")
            raise
            
    async def _create_tables(self):
        """Create required tables if they don't exist."""
        async with self.connection_pool.acquire() as conn:
            # Trading signals table
            await conn.execute("""
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
                )
            """)
            
            # Risk decisions table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS risk_decisions (
                    id SERIAL PRIMARY KEY,
                    signal_id INTEGER,
                    decision VARCHAR(20) NOT NULL,
                    reason TEXT,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Orders table
            await conn.execute("""
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
                )
            """)
            
            # Account states table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS account_states (
                    id SERIAL PRIMARY KEY,
                    equity DECIMAL(12,2) NOT NULL,
                    buying_power DECIMAL(12,2) NOT NULL,
                    cash DECIMAL(12,2),
                    portfolio_value DECIMAL(12,2),
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # System events table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS system_events (
                    id SERIAL PRIMARY KEY,
                    event_type VARCHAR(50) NOT NULL,
                    description TEXT NOT NULL,
                    metadata JSONB,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Create indexes
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_signals_symbol_timestamp ON trading_signals(symbol, timestamp)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_symbol_timestamp ON orders(symbol, timestamp)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON system_events(event_type, timestamp)")
            
    async def log_signal_generated(self, signal: TradeSignal, strategy: str) -> int:
        """Log a generated trading signal."""
        async with self.connection_pool.acquire() as conn:
            signal_id = await conn.fetchval("""
                INSERT INTO trading_signals 
                (symbol, side, qty, order_type, confidence, timestamp, strategy, price, stop_price, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            """, signal.symbol, signal.side.value, signal.qty, signal.order_type.value,
                signal.confidence, signal.timestamp, strategy, signal.price, 
                signal.stop_price, signal.metadata)
            
            return signal_id
            
    async def log_risk_rejection(self, signal: TradeSignal, reason: str):
        """Log a risk engine rejection."""
        async with self.connection_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO risk_decisions (decision, reason, timestamp)
                VALUES ($1, $2, $3)
            """, 'REJECTED', reason, datetime.now())
            
    async def log_risk_approval(self, signal: TradeSignal):
        """Log a risk engine approval."""
        async with self.connection_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO risk_decisions (decision, reason, timestamp)
                VALUES ($1, $2, $3)
            """, 'APPROVED', f"Signal for {signal.symbol} approved", datetime.now())
            
    async def log_order_placed(self, signal: TradeSignal, order_id: str, metadata: dict):
        """Log an order placement."""
        async with self.connection_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO orders 
                (broker_order_id, symbol, side, qty, status, timestamp, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, order_id, signal.symbol, signal.side.value, signal.qty, 
                'SUBMITTED', datetime.now(), metadata)
                
    async def log_account_state(self, state: Dict[str, float]):
        """Log account state snapshot."""
        async with self.connection_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO account_states 
                (equity, buying_power, cash, portfolio_value, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            """, state['equity'], state['buying_power'], 
                state.get('cash', 0), state.get('portfolio_value', 0), datetime.now())
                
    async def log_connection_event(self, broker: str, event: str, metadata: dict):
        """Log connection events."""
        await self.log_system_event(f"BROKER_{event.upper()}", 
                                   f"{broker} {event.lower()}", metadata)
                                   
    async def log_error(self, event_type: str, description: str, metadata: dict = None):
        """Log error events."""
        await self.log_system_event(f"ERROR_{event_type.upper().replace(' ', '_')}", 
                                   description, metadata or {})
                                   
    async def log_system_event(self, event_type: str, description: str, metadata: dict = None):
        """Log general system events."""
        async with self.connection_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO system_events (event_type, description, metadata, timestamp)
                VALUES ($1, $2, $3, $4)
            """, event_type, description, metadata or {}, datetime.now())
            
    async def get_recent_signals(self, symbol: str = None, hours: int = 24) -> list:
        """Get recent trading signals."""
        async with self.connection_pool.acquire() as conn:
            if symbol:
                rows = await conn.fetch("""
                    SELECT * FROM trading_signals 
                    WHERE symbol = $1 AND timestamp > NOW() - INTERVAL '%s hours'
                    ORDER BY timestamp DESC
                """ % hours, symbol)
            else:
                rows = await conn.fetch("""
                    SELECT * FROM trading_signals 
                    WHERE timestamp > NOW() - INTERVAL '%s hours'
                    ORDER BY timestamp DESC
                """ % hours)
                
            return [dict(row) for row in rows]
            
    async def get_strategy_performance(self, strategy: str, days: int = 30) -> dict:
        """Get performance metrics for a strategy."""
        async with self.connection_pool.acquire() as conn:
            # Get signal counts
            signal_stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_signals,
                    AVG(confidence) as avg_confidence,
                    COUNT(CASE WHEN side = 'buy' THEN 1 END) as buy_signals,
                    COUNT(CASE WHEN side = 'sell' THEN 1 END) as sell_signals
                FROM trading_signals 
                WHERE strategy = $1 AND timestamp > NOW() - INTERVAL '%s days'
            """ % days, strategy)
            
            return dict(signal_stats) if signal_stats else {}
            
    async def close(self):
        """Close database connections."""
        if self.connection_pool:
            await self.connection_pool.close()
            self.logger.info("Database connections closed")