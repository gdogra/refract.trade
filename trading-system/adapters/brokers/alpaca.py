"""
Alpaca broker adapter implementation.

Implements the BrokerAdapter interface for Alpaca Markets.
Supports both paper and live trading environments.
"""

import os
import asyncio
import logging
from typing import List, Dict, Any, Callable, Optional
from decimal import Decimal
from datetime import datetime
import uuid

try:
    import alpaca_trade_api as tradeapi
    from alpaca_trade_api.stream import Stream
    from alpaca_trade_api.common import URL
except ImportError:
    raise ImportError("alpaca_trade_api required. Install with: pip install alpaca-trade-api")

from .base import BrokerAdapter, BrokerError, ConnectionError, OrderError, MarketDataError
from domain.models import (
    TradeSignal, PositionSnapshot, AccountSnapshot, OrderEvent, MarketEvent,
    Side, OrderType, OrderStatus, MarketEventType
)


class AlpacaBrokerAdapter(BrokerAdapter):
    """
    Alpaca Markets broker adapter.
    
    Provides access to Alpaca's trading and market data APIs.
    Defaults to paper trading for safety.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.api_client = None
        self.stream_client = None
        self._connected = False
        
        # Load credentials from environment
        self.api_key = os.getenv('ALPACA_API_KEY')
        self.secret_key = os.getenv('ALPACA_SECRET_KEY')
        self.base_url = os.getenv('ALPACA_BASE_URL', 'https://paper-api.alpaca.markets')  # Default to paper
        
        if not self.api_key or not self.secret_key:
            raise BrokerError("Alpaca credentials not found in environment variables")
    
    async def connect(self) -> bool:
        """Establish connection to Alpaca."""
        try:
            # Initialize API client
            self.api_client = tradeapi.REST(
                self.api_key,
                self.secret_key,
                self.base_url,
                api_version='v2'
            )
            
            # Test connection by getting account
            account = self.api_client.get_account()
            if account.trading_blocked:
                raise ConnectionError("Alpaca account is blocked from trading")
            
            # Initialize streaming client
            self.stream_client = Stream(
                self.api_key,
                self.secret_key,
                base_url=self.base_url,
                data_feed='iex'  # Use IEX for market data
            )
            
            self._connected = True
            self.logger.info(f"Connected to Alpaca ({self.base_url})")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect to Alpaca: {e}")
            self._connected = False
            raise ConnectionError(f"Alpaca connection failed: {e}")
    
    async def disconnect(self) -> None:
        """Close Alpaca connection."""
        try:
            if self.stream_client:
                await self.stream_client.stop()
                self.stream_client = None
            
            self.api_client = None
            self._connected = False
            self.logger.info("Disconnected from Alpaca")
            
        except Exception as e:
            self.logger.error(f"Error disconnecting from Alpaca: {e}")
    
    async def is_connected(self) -> bool:
        """Check if connected to Alpaca."""
        return self._connected and self.api_client is not None
    
    async def get_account(self) -> AccountSnapshot:
        """Get Alpaca account information."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            account = self.api_client.get_account()
            return AccountSnapshot(
                equity=Decimal(str(account.equity)),
                buying_power=Decimal(str(account.buying_power)),
                cash=Decimal(str(account.cash)),
                day_trades_remaining=getattr(account, 'day_trade_count', 0),
                timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            self.logger.error(f"Error getting account: {e}")
            raise BrokerError(f"Failed to get account: {e}")
    
    async def get_positions(self) -> List[PositionSnapshot]:
        """Get all Alpaca positions."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            positions = self.api_client.list_positions()
            snapshots = []
            
            for pos in positions:
                # Calculate exposure percentage (requires total portfolio value)
                account = await self.get_account()
                market_value = Decimal(str(pos.market_value))
                exposure_pct = float(market_value / account.equity) * 100 if account.equity > 0 else 0.0
                
                snapshot = PositionSnapshot(
                    symbol=pos.symbol,
                    qty=int(pos.qty),
                    avg_price=Decimal(str(pos.avg_entry_price)),
                    unrealized_pl=Decimal(str(pos.unrealized_pl)),
                    exposure_pct=exposure_pct,
                    timestamp=datetime.utcnow()
                )
                snapshots.append(snapshot)
            
            return snapshots
            
        except Exception as e:
            self.logger.error(f"Error getting positions: {e}")
            raise BrokerError(f"Failed to get positions: {e}")
    
    async def get_position(self, symbol: str) -> Optional[PositionSnapshot]:
        """Get position for specific symbol."""
        try:
            position = self.api_client.get_position(symbol)
            
            # Calculate exposure percentage
            account = await self.get_account()
            market_value = Decimal(str(position.market_value))
            exposure_pct = float(market_value / account.equity) * 100 if account.equity > 0 else 0.0
            
            return PositionSnapshot(
                symbol=position.symbol,
                qty=int(position.qty),
                avg_price=Decimal(str(position.avg_entry_price)),
                unrealized_pl=Decimal(str(position.unrealized_pl)),
                exposure_pct=exposure_pct,
                timestamp=datetime.utcnow()
            )
            
        except Exception:
            # No position exists
            return None
    
    async def place_order(self, signal: TradeSignal) -> OrderEvent:
        """Place order with Alpaca."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            # Convert signal to Alpaca order format
            order_request = {
                'symbol': signal.symbol,
                'qty': signal.qty,
                'side': signal.side.value,
                'type': self._convert_order_type(signal.order_type),
                'time_in_force': 'day'
            }
            
            # Add price for limit orders
            if signal.order_type in [OrderType.LIMIT, OrderType.STOP_LIMIT] and signal.price:
                order_request['limit_price'] = str(signal.price)
            
            # Add stop price for stop orders
            if signal.order_type in [OrderType.STOP, OrderType.STOP_LIMIT] and signal.stop_price:
                order_request['stop_price'] = str(signal.stop_price)
            
            # Submit order
            order = self.api_client.submit_order(**order_request)
            
            return OrderEvent(
                order_id=str(uuid.uuid4()),
                signal_id=signal.id,
                status=OrderStatus.SUBMITTED,
                timestamp=datetime.utcnow(),
                broker_order_id=order.id,
                metadata={'alpaca_order': order._raw}
            )
            
        except Exception as e:
            self.logger.error(f"Error placing order: {e}")
            
            return OrderEvent(
                order_id=str(uuid.uuid4()),
                signal_id=signal.id,
                status=OrderStatus.REJECTED,
                timestamp=datetime.utcnow(),
                rejection_reason=str(e),
                metadata={'error': str(e)}
            )
    
    async def cancel_order(self, order_id: str) -> OrderEvent:
        """Cancel Alpaca order."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            self.api_client.cancel_order(order_id)
            
            return OrderEvent(
                order_id=str(uuid.uuid4()),
                signal_id="",  # We don't have signal ID for cancellation
                status=OrderStatus.CANCELLED,
                timestamp=datetime.utcnow(),
                broker_order_id=order_id
            )
            
        except Exception as e:
            self.logger.error(f"Error cancelling order: {e}")
            raise OrderError(f"Failed to cancel order: {e}")
    
    async def get_order_status(self, order_id: str) -> OrderEvent:
        """Get Alpaca order status."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            order = self.api_client.get_order(order_id)
            
            return OrderEvent(
                order_id=str(uuid.uuid4()),
                signal_id="",  # We don't have signal ID from Alpaca order
                status=self._convert_order_status(order.status),
                timestamp=datetime.utcnow(),
                broker_order_id=order.id,
                filled_qty=int(order.filled_qty) if order.filled_qty else 0,
                filled_price=Decimal(str(order.filled_avg_price)) if order.filled_avg_price else None,
                metadata={'alpaca_order': order._raw}
            )
            
        except Exception as e:
            self.logger.error(f"Error getting order status: {e}")
            raise OrderError(f"Failed to get order status: {e}")
    
    async def stream_market_data(
        self, 
        symbols: List[str], 
        callback: Callable[[MarketEvent], None]
    ) -> None:
        """Stream real-time market data from Alpaca."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            async def trade_handler(trade):
                """Handle incoming trade data."""
                event = MarketEvent(
                    type=MarketEventType.TICK,
                    symbol=trade.symbol,
                    timestamp=datetime.utcnow(),
                    payload={
                        'price': float(trade.price),
                        'size': int(trade.size),
                        'timestamp': trade.timestamp.isoformat()
                    }
                )
                callback(event)
            
            async def quote_handler(quote):
                """Handle incoming quote data."""
                event = MarketEvent(
                    type=MarketEventType.TICK,
                    symbol=quote.symbol,
                    timestamp=datetime.utcnow(),
                    payload={
                        'bid': float(quote.bid_price),
                        'ask': float(quote.ask_price),
                        'bid_size': int(quote.bid_size),
                        'ask_size': int(quote.ask_size),
                        'timestamp': quote.timestamp.isoformat()
                    }
                )
                callback(event)
            
            # Subscribe to trades and quotes
            self.stream_client.subscribe_trades(trade_handler, *symbols)
            self.stream_client.subscribe_quotes(quote_handler, *symbols)
            
            # Start streaming
            await self.stream_client.run()
            
        except Exception as e:
            self.logger.error(f"Error streaming market data: {e}")
            raise MarketDataError(f"Failed to stream market data: {e}")
    
    async def get_market_hours(self) -> Dict[str, Any]:
        """Get market hours from Alpaca."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            clock = self.api_client.get_clock()
            calendar = self.api_client.get_calendar(start=datetime.now().date())[0]
            
            return {
                'is_open': clock.is_open,
                'next_open': clock.next_open.isoformat(),
                'next_close': clock.next_close.isoformat(),
                'session_open': calendar.open.isoformat(),
                'session_close': calendar.close.isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting market hours: {e}")
            raise MarketDataError(f"Failed to get market hours: {e}")
    
    async def get_current_price(self, symbol: str) -> Optional[Decimal]:
        """Get current price from Alpaca."""
        if not await self.is_connected():
            raise ConnectionError("Not connected to Alpaca")
        
        try:
            # Get latest trade
            latest_trade = self.api_client.get_latest_trade(symbol)
            if latest_trade:
                return Decimal(str(latest_trade.price))
            
            # Fallback to last quote
            latest_quote = self.api_client.get_latest_quote(symbol)
            if latest_quote:
                # Use midpoint of bid/ask
                bid = Decimal(str(latest_quote.bidprice))
                ask = Decimal(str(latest_quote.askprice))
                return (bid + ask) / 2
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting current price: {e}")
            return None
    
    def _convert_order_type(self, order_type: OrderType) -> str:
        """Convert internal order type to Alpaca format."""
        mapping = {
            OrderType.MARKET: 'market',
            OrderType.LIMIT: 'limit',
            OrderType.STOP: 'stop',
            OrderType.STOP_LIMIT: 'stop_limit'
        }
        return mapping.get(order_type, 'market')
    
    def _convert_order_status(self, alpaca_status: str) -> OrderStatus:
        """Convert Alpaca order status to internal format."""
        mapping = {
            'new': OrderStatus.SUBMITTED,
            'partially_filled': OrderStatus.PARTIALLY_FILLED,
            'filled': OrderStatus.FILLED,
            'done_for_day': OrderStatus.CANCELLED,
            'canceled': OrderStatus.CANCELLED,
            'expired': OrderStatus.CANCELLED,
            'replaced': OrderStatus.CANCELLED,
            'pending_cancel': OrderStatus.PENDING,
            'pending_replace': OrderStatus.PENDING,
            'accepted': OrderStatus.SUBMITTED,
            'pending_new': OrderStatus.PENDING,
            'accepted_for_bidding': OrderStatus.SUBMITTED,
            'stopped': OrderStatus.CANCELLED,
            'rejected': OrderStatus.REJECTED,
            'suspended': OrderStatus.CANCELLED,
            'calculated': OrderStatus.SUBMITTED
        }
        return mapping.get(alpaca_status.lower(), OrderStatus.PENDING)