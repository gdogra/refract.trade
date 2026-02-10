import os
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
import pandas as pd

from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, LimitOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce, OrderType as AlpacaOrderType
from alpaca.data import StockHistoricalDataClient, StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from alpaca.data.live import StockDataStream

from models.trade_signal import TradeSignal, Side, OrderType
from utils.database import DatabaseLogger


class AlpacaAdapter:
    """
    Broker adapter for Alpaca Trading API.
    
    Provides interface between the trading bot and Alpaca's API.
    """
    
    def __init__(self):
        self.trading_client: Optional[TradingClient] = None
        self.data_client: Optional[StockHistoricalDataClient] = None
        self.stream_client: Optional[StockDataStream] = None
        self.logger = logging.getLogger(__name__)
        self.db_logger = DatabaseLogger()
        self.is_connected = False
        
    async def connect(self) -> bool:
        """
        Initialize connection to Alpaca API.
        
        Reads API credentials from environment variables and initializes clients.
        """
        try:
            api_key = os.getenv('ALPACA_API_KEY')
            secret_key = os.getenv('ALPACA_SECRET_KEY')
            
            if not api_key or not secret_key:
                raise ValueError("Missing Alpaca API credentials in environment variables")
                
            # Initialize trading client (paper trading by default)
            self.trading_client = TradingClient(
                api_key=api_key,
                secret_key=secret_key,
                paper=True  # Use paper trading for safety
            )
            
            # Initialize data client
            self.data_client = StockHistoricalDataClient(
                api_key=api_key,
                secret_key=secret_key
            )
            
            # Initialize streaming client
            self.stream_client = StockDataStream(
                api_key=api_key,
                secret_key=secret_key
            )
            
            # Test connection
            account = self.trading_client.get_account()
            self.is_connected = True
            
            self.logger.info(f"Connected to Alpaca - Account: {account.account_number}")
            self.logger.info(f"Paper Trading: {account.trading_blocked}")
            
            await self.db_logger.log_connection_event("Alpaca", "Connected", {
                'account_number': account.account_number,
                'equity': float(account.equity),
                'buying_power': float(account.buying_power)
            })
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect to Alpaca: {e}")
            await self.db_logger.log_error("Alpaca connection failed", str(e))
            return False
            
    async def get_account_state(self) -> Dict[str, float]:
        """
        Fetch current account state including equity and buying power.
        """
        if not self.is_connected or not self.trading_client:
            raise RuntimeError("Not connected to Alpaca")
            
        try:
            account = self.trading_client.get_account()
            
            state = {
                'equity': float(account.equity),
                'buying_power': float(account.buying_power),
                'cash': float(account.cash),
                'portfolio_value': float(account.portfolio_value),
                'last_equity': float(account.last_equity),
                'multiplier': int(account.multiplier)
            }
            
            await self.db_logger.log_account_state(state)
            return state
            
        except Exception as e:
            self.logger.error(f"Failed to get account state: {e}")
            await self.db_logger.log_error("Get account state failed", str(e))
            raise
            
    async def place_order(self, signal: TradeSignal) -> Optional[str]:
        """
        Convert TradeSignal into Alpaca order and submit.
        
        Returns order ID if successful, None if failed.
        """
        if not self.is_connected or not self.trading_client:
            raise RuntimeError("Not connected to Alpaca")
            
        try:
            # Convert signal to Alpaca order request
            order_request = self._signal_to_order_request(signal)
            
            # Submit order
            order = self.trading_client.submit_order(order_data=order_request)
            
            self.logger.info(
                f"Order placed: {order.id} - {signal.symbol} {signal.side.value} "
                f"{signal.qty} shares at {order.created_at}"
            )
            
            await self.db_logger.log_order_placed(signal, order.id, {
                'alpaca_order_id': order.id,
                'status': order.status,
                'created_at': order.created_at,
                'filled_qty': order.filled_qty or 0,
                'filled_avg_price': order.filled_avg_price
            })
            
            return order.id
            
        except Exception as e:
            self.logger.error(f"Failed to place order for {signal.symbol}: {e}")
            await self.db_logger.log_error(f"Order placement failed: {signal.symbol}", str(e))
            return None
            
    def _signal_to_order_request(self, signal: TradeSignal):
        """Convert TradeSignal to Alpaca order request."""
        
        # Convert side
        side = OrderSide.BUY if signal.side == Side.BUY else OrderSide.SELL
        
        # Convert order type and create request
        if signal.order_type == OrderType.MARKET:
            return MarketOrderRequest(
                symbol=signal.symbol,
                qty=signal.qty,
                side=side,
                time_in_force=TimeInForce.DAY
            )
        elif signal.order_type == OrderType.LIMIT:
            return LimitOrderRequest(
                symbol=signal.symbol,
                qty=signal.qty,
                side=side,
                time_in_force=TimeInForce.DAY,
                limit_price=signal.price
            )
        else:
            raise ValueError(f"Unsupported order type: {signal.order_type}")
            
    async def get_positions(self) -> Dict[str, float]:
        """Get current positions as dict of symbol -> market value."""
        if not self.is_connected or not self.trading_client:
            raise RuntimeError("Not connected to Alpaca")
            
        try:
            positions = self.trading_client.get_all_positions()
            
            return {
                pos.symbol: float(pos.market_value)
                for pos in positions
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get positions: {e}")
            return {}
            
    async def get_historical_data(self, symbol: str, days: int = 100) -> pd.DataFrame:
        """Get historical stock data for strategy calculations."""
        if not self.data_client:
            raise RuntimeError("Data client not initialized")
            
        try:
            request_params = StockBarsRequest(
                symbol_or_symbols=[symbol],
                timeframe=TimeFrame.Day,
                start=datetime.now() - timedelta(days=days),
                end=datetime.now()
            )
            
            bars = self.data_client.get_stock_bars(request_params)
            
            # Convert to DataFrame
            data = []
            for bar in bars[symbol]:
                data.append({
                    'timestamp': bar.timestamp,
                    'open': bar.open,
                    'high': bar.high,
                    'low': bar.low,
                    'close': bar.close,
                    'volume': bar.volume
                })
                
            df = pd.DataFrame(data)
            df.set_index('timestamp', inplace=True)
            
            return df
            
        except Exception as e:
            self.logger.error(f"Failed to get historical data for {symbol}: {e}")
            return pd.DataFrame()
            
    async def stream_market_data(self, symbols: list, callback):
        """
        Start streaming market data for given symbols.
        
        Args:
            symbols: List of symbols to stream
            callback: Function to call with new data
        """
        if not self.stream_client:
            raise RuntimeError("Stream client not initialized")
            
        try:
            async def quote_data_handler(data):
                await callback(data)
                
            self.stream_client.subscribe_quotes(quote_data_handler, *symbols)
            
            self.logger.info(f"Started streaming data for: {', '.join(symbols)}")
            await self.stream_client.run()
            
        except Exception as e:
            self.logger.error(f"Streaming error: {e}")
            await self.db_logger.log_error("Market data streaming failed", str(e))
            
    async def disconnect(self):
        """Clean up connections."""
        if self.stream_client:
            await self.stream_client.stop()
            
        self.is_connected = False
        self.logger.info("Disconnected from Alpaca")
        await self.db_logger.log_connection_event("Alpaca", "Disconnected", {})