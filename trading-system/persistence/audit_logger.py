"""
Comprehensive audit logging for trading system.

All events, decisions, and actions are logged for compliance and analysis.
Provides append-only event store with PostgreSQL backend.
"""

import os
import asyncio
import logging
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import asdict

try:
    import asyncpg
except ImportError:
    raise ImportError("asyncpg required for audit logging. Install with: pip install asyncpg")

from domain.events import DomainEvent, EventType
from domain.models import TradeSignal, TradeIdea, ApprovedTrade, RejectedTrade, OrderEvent


class AuditLogger:
    """
    Audit logging service for trading system compliance.
    
    Provides:
    - Append-only event logging
    - Trade decision audit trail
    - Risk decision tracking
    - AI suggestion logging
    - Performance metrics
    """
    
    def __init__(self):
        self.connection_pool = None
        self.logger = logging.getLogger(__name__)
        self._buffer = []
        self._buffer_size = 100
        self._flush_task = None
        
    async def initialize(self) -> bool:
        """Initialize audit logger and database connection."""
        try:
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                raise ValueError("DATABASE_URL environment variable required")
            
            # Create connection pool
            self.connection_pool = await asyncpg.create_pool(
                database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            
            # Create audit tables
            await self._create_audit_tables()
            
            # Start buffer flush task
            self._flush_task = asyncio.create_task(self._flush_buffer_periodically())
            
            self.logger.info("Audit logger initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize audit logger: {e}")
            return False
    
    async def shutdown(self):
        """Shutdown audit logger and flush remaining events."""
        try:
            # Cancel flush task
            if self._flush_task:
                self._flush_task.cancel()
                try:
                    await self._flush_task
                except asyncio.CancelledError:
                    pass
            
            # Flush remaining buffer
            await self._flush_buffer()
            
            # Close connection pool
            if self.connection_pool:
                await self.connection_pool.close()
            
            self.logger.info("Audit logger shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during audit logger shutdown: {e}")
    
    async def _create_audit_tables(self):
        """Create audit tables if they don't exist."""
        async with self.connection_pool.acquire() as conn:
            # Main events table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_events (
                    id BIGSERIAL PRIMARY KEY,
                    event_id UUID NOT NULL UNIQUE,
                    event_type VARCHAR(50) NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    metadata JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Trade signals table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS trade_signals (
                    id BIGSERIAL PRIMARY KEY,
                    signal_id UUID NOT NULL UNIQUE,
                    symbol VARCHAR(10) NOT NULL,
                    side VARCHAR(4) NOT NULL,
                    qty INTEGER NOT NULL,
                    order_type VARCHAR(20) NOT NULL,
                    confidence DECIMAL(3,2) NOT NULL,
                    source VARCHAR(20) NOT NULL,
                    strategy_name VARCHAR(50),
                    price DECIMAL(12,4),
                    stop_price DECIMAL(12,4),
                    metadata JSONB,
                    created_at TIMESTAMPTZ NOT NULL,
                    logged_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Risk decisions table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS risk_decisions (
                    id BIGSERIAL PRIMARY KEY,
                    signal_id UUID NOT NULL,
                    decision VARCHAR(20) NOT NULL,
                    decision_timestamp TIMESTAMPTZ NOT NULL,
                    rejection_reason TEXT,
                    risk_metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Order events table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS order_events (
                    id BIGSERIAL PRIMARY KEY,
                    order_id UUID NOT NULL,
                    signal_id UUID NOT NULL,
                    broker_order_id VARCHAR(100),
                    status VARCHAR(20) NOT NULL,
                    filled_qty INTEGER DEFAULT 0,
                    filled_price DECIMAL(12,4),
                    rejection_reason TEXT,
                    metadata JSONB,
                    timestamp TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # AI trade ideas table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_trade_ideas (
                    id BIGSERIAL PRIMARY KEY,
                    idea_id UUID NOT NULL UNIQUE,
                    description TEXT NOT NULL,
                    rationale TEXT NOT NULL,
                    risk_notes TEXT NOT NULL,
                    confidence DECIMAL(3,2) NOT NULL,
                    market_context JSONB,
                    approved BOOLEAN,
                    approved_at TIMESTAMPTZ,
                    user_notes TEXT,
                    created_at TIMESTAMPTZ NOT NULL,
                    logged_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Performance metrics table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id BIGSERIAL PRIMARY KEY,
                    metric_type VARCHAR(50) NOT NULL,
                    metric_value DECIMAL(12,4) NOT NULL,
                    metadata JSONB,
                    timestamp TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Create indexes for performance
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_audit_events_type_timestamp ON audit_events(event_type, timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_trade_signals_symbol_timestamp ON trade_signals(symbol, created_at)",
                "CREATE INDEX IF NOT EXISTS idx_risk_decisions_signal_id ON risk_decisions(signal_id)",
                "CREATE INDEX IF NOT EXISTS idx_order_events_signal_id ON order_events(signal_id)",
                "CREATE INDEX IF NOT EXISTS idx_ai_ideas_approved ON ai_trade_ideas(approved, created_at)",
                "CREATE INDEX IF NOT EXISTS idx_performance_type_timestamp ON performance_metrics(metric_type, timestamp)"
            ]
            
            for index_sql in indexes:
                await conn.execute(index_sql)
    
    async def log_event(self, event: DomainEvent):
        """Log a domain event."""
        event_data = {
            'event_id': event.event_id,
            'event_type': event.event_type.value,
            'timestamp': event.timestamp,
            'metadata': event.metadata
        }
        
        # Add to buffer
        self._buffer.append(('audit_events', event_data))
        
        # Flush if buffer is full
        if len(self._buffer) >= self._buffer_size:
            await self._flush_buffer()
    
    async def log_trade_signal(self, signal: TradeSignal):
        """Log a trade signal."""
        signal_data = {
            'signal_id': signal.id,
            'symbol': signal.symbol,
            'side': signal.side.value,
            'qty': signal.qty,
            'order_type': signal.order_type.value,
            'confidence': float(signal.confidence),
            'source': signal.source.value,
            'strategy_name': signal.strategy_name,
            'price': float(signal.price) if signal.price else None,
            'stop_price': float(signal.stop_price) if signal.stop_price else None,
            'metadata': signal.metadata,
            'created_at': signal.created_at
        }
        
        self._buffer.append(('trade_signals', signal_data))
        
        if len(self._buffer) >= self._buffer_size:
            await self._flush_buffer()
    
    async def log_risk_decision(self, approved_trade: Optional[ApprovedTrade] = None, 
                               rejected_trade: Optional[RejectedTrade] = None):
        """Log a risk engine decision."""
        if approved_trade:
            decision_data = {
                'signal_id': approved_trade.signal.id,
                'decision': 'APPROVED',
                'decision_timestamp': approved_trade.approved_at,
                'rejection_reason': None,
                'risk_metadata': approved_trade.risk_check_metadata
            }
        elif rejected_trade:
            decision_data = {
                'signal_id': rejected_trade.signal.id,
                'decision': 'REJECTED',
                'decision_timestamp': rejected_trade.rejected_at,
                'rejection_reason': rejected_trade.rejection_reason,
                'risk_metadata': rejected_trade.risk_check_metadata
            }
        else:
            return
        
        self._buffer.append(('risk_decisions', decision_data))
        
        if len(self._buffer) >= self._buffer_size:
            await self._flush_buffer()
    
    async def log_order_event(self, order_event: OrderEvent):
        """Log an order lifecycle event."""
        order_data = {
            'order_id': order_event.order_id,
            'signal_id': order_event.signal_id,
            'broker_order_id': order_event.broker_order_id,
            'status': order_event.status.value,
            'filled_qty': order_event.filled_qty,
            'filled_price': float(order_event.filled_price) if order_event.filled_price else None,
            'rejection_reason': order_event.rejection_reason,
            'metadata': order_event.metadata,
            'timestamp': order_event.timestamp
        }
        
        self._buffer.append(('order_events', order_data))
        
        if len(self._buffer) >= self._buffer_size:
            await self._flush_buffer()
    
    async def log_trade_idea(self, trade_idea: TradeIdea):
        """Log an AI-generated trade idea."""
        idea_data = {
            'idea_id': trade_idea.id,
            'description': trade_idea.description,
            'rationale': trade_idea.rationale,
            'risk_notes': trade_idea.risk_notes,
            'confidence': float(trade_idea.confidence),
            'market_context': trade_idea.market_context,
            'approved': trade_idea.approved,
            'approved_at': trade_idea.approved_at,
            'user_notes': trade_idea.user_notes,
            'created_at': trade_idea.created_at
        }
        
        self._buffer.append(('ai_trade_ideas', idea_data))
        
        if len(self._buffer) >= self._buffer_size:
            await self._flush_buffer()
    
    async def log_performance_metric(self, metric_type: str, value: float, metadata: Dict[str, Any] = None):
        """Log a performance metric."""
        metric_data = {
            'metric_type': metric_type,
            'metric_value': value,
            'metadata': metadata or {},
            'timestamp': datetime.utcnow()
        }
        
        self._buffer.append(('performance_metrics', metric_data))
        
        if len(self._buffer) >= self._buffer_size:
            await self._flush_buffer()
    
    async def _flush_buffer(self):
        """Flush buffered log entries to database."""
        if not self._buffer or not self.connection_pool:
            return
        
        try:
            async with self.connection_pool.acquire() as conn:
                # Group by table
                tables = {}
                for table, data in self._buffer:
                    if table not in tables:
                        tables[table] = []
                    tables[table].append(data)
                
                # Insert into each table
                for table, records in tables.items():
                    if records:
                        await self._bulk_insert(conn, table, records)
                
                # Clear buffer
                self._buffer.clear()
                
        except Exception as e:
            self.logger.error(f"Error flushing audit buffer: {e}")
    
    async def _bulk_insert(self, conn, table: str, records: List[Dict[str, Any]]):
        """Bulk insert records into a table."""
        if not records:
            return
        
        # Get column names from first record
        columns = list(records[0].keys())
        
        # Create placeholders
        placeholders = ', '.join([f'${i+1}' for i in range(len(columns))])
        column_list = ', '.join(columns)
        
        # Prepare insert statement
        sql = f"INSERT INTO {table} ({column_list}) VALUES ({placeholders})"
        
        # Prepare values
        values = []
        for record in records:
            row_values = []
            for col in columns:
                value = record[col]
                # Convert dict/list to JSON string for JSONB columns
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                row_values.append(value)
            values.append(row_values)
        
        # Execute bulk insert
        await conn.executemany(sql, values)
        
        self.logger.debug(f"Bulk inserted {len(records)} records into {table}")
    
    async def _flush_buffer_periodically(self):
        """Periodically flush buffer to database."""
        while True:
            try:
                await asyncio.sleep(30)  # Flush every 30 seconds
                await self._flush_buffer()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in periodic buffer flush: {e}")
    
    async def get_audit_trail(
        self, 
        signal_id: Optional[str] = None,
        event_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get audit trail for analysis."""
        if not self.connection_pool:
            return []
        
        try:
            async with self.connection_pool.acquire() as conn:
                # Build WHERE clause
                conditions = []
                params = []
                param_count = 0
                
                if event_type:
                    param_count += 1
                    conditions.append(f"event_type = ${param_count}")
                    params.append(event_type)
                
                if start_time:
                    param_count += 1
                    conditions.append(f"timestamp >= ${param_count}")
                    params.append(start_time)
                
                if end_time:
                    param_count += 1
                    conditions.append(f"timestamp <= ${param_count}")
                    params.append(end_time)
                
                where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
                
                param_count += 1
                sql = f"""
                    SELECT event_id, event_type, timestamp, metadata
                    FROM audit_events
                    {where_clause}
                    ORDER BY timestamp DESC
                    LIMIT ${param_count}
                """
                params.append(limit)
                
                rows = await conn.fetch(sql, *params)
                
                return [
                    {
                        'event_id': str(row['event_id']),
                        'event_type': row['event_type'],
                        'timestamp': row['timestamp'].isoformat(),
                        'metadata': row['metadata']
                    }
                    for row in rows
                ]
                
        except Exception as e:
            self.logger.error(f"Error getting audit trail: {e}")
            return []
    
    async def get_performance_summary(self, days: int = 30) -> Dict[str, Any]:
        """Get performance summary for the last N days."""
        if not self.connection_pool:
            return {}
        
        try:
            async with self.connection_pool.acquire() as conn:
                # Get signal stats
                signal_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(*) as total_signals,
                        COUNT(CASE WHEN source = 'strategy' THEN 1 END) as strategy_signals,
                        COUNT(CASE WHEN source = 'ai' THEN 1 END) as ai_signals,
                        AVG(confidence) as avg_confidence
                    FROM trade_signals 
                    WHERE created_at > NOW() - INTERVAL '%s days'
                """ % days)
                
                # Get risk stats
                risk_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(CASE WHEN decision = 'APPROVED' THEN 1 END) as approved,
                        COUNT(CASE WHEN decision = 'REJECTED' THEN 1 END) as rejected,
                        COUNT(*) as total_decisions
                    FROM risk_decisions 
                    WHERE decision_timestamp > NOW() - INTERVAL '%s days'
                """ % days)
                
                # Get order stats
                order_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(CASE WHEN status = 'filled' THEN 1 END) as filled_orders,
                        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_orders,
                        COUNT(*) as total_orders
                    FROM order_events 
                    WHERE timestamp > NOW() - INTERVAL '%s days'
                """ % days)
                
                return {
                    'period_days': days,
                    'signals': dict(signal_stats) if signal_stats else {},
                    'risk_decisions': dict(risk_stats) if risk_stats else {},
                    'orders': dict(order_stats) if order_stats else {},
                    'generated_at': datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting performance summary: {e}")
            return {'error': str(e)}