"""
Moving Average Crossover Strategy.

Example implementation of a trading strategy that generates signals
based on moving average crossovers.
"""

from typing import List, Dict, Any, Set, Optional
from decimal import Decimal
from datetime import datetime, timedelta
import pandas as pd

from .base import BaseStrategy
from domain.models import (
    TradeSignal, MarketEvent, MarketEventType, Side, OrderType, 
    SignalSource, create_trade_signal
)


class MovingAverageCrossoverStrategy(BaseStrategy):
    """
    Moving Average Crossover Strategy.
    
    Generates buy signals when short MA crosses above long MA.
    Generates sell signals when short MA crosses below long MA.
    
    Strategy is stateless - all calculations done from incoming data.
    """
    
    def __init__(
        self, 
        symbols: List[str], 
        short_period: int = 20, 
        long_period: int = 50,
        min_confidence: float = 0.6
    ):
        super().__init__("MA_Crossover", symbols)
        self.short_period = short_period
        self.long_period = long_period
        self.min_confidence = min_confidence
        
        # Store recent price data for calculations
        self.price_history: Dict[str, List[Dict[str, Any]]] = {}
        self.last_signal_time: Dict[str, datetime] = {}
    
    async def process_market_event(self, event: MarketEvent) -> List[TradeSignal]:
        """Process market event and generate signals."""
        if not self.is_active or event.type != MarketEventType.TICK:
            return []
        
        symbol = event.symbol
        if not self.is_symbol_relevant(symbol):
            return []
        
        # Extract price from event payload
        price = self._extract_price(event.payload)
        if price is None:
            return []
        
        # Update price history
        self._update_price_history(symbol, price, event.timestamp)
        
        # Calculate moving averages
        short_ma, long_ma = self._calculate_moving_averages(symbol)
        if short_ma is None or long_ma is None:
            return []  # Not enough data
        
        # Get previous MAs for crossover detection
        prev_short_ma, prev_long_ma = self._get_previous_moving_averages(symbol)
        if prev_short_ma is None or prev_long_ma is None:
            return []  # Need previous data for crossover
        
        # Check for crossover signals
        signal = self._detect_crossover(
            symbol, price, short_ma, long_ma, prev_short_ma, prev_long_ma, event.timestamp
        )
        
        return [signal] if signal else []
    
    def get_required_symbols(self) -> Set[str]:
        """Get symbols required by this strategy."""
        return self.symbols
    
    def _extract_price(self, payload: Dict[str, Any]) -> Optional[float]:
        """Extract price from market event payload."""
        # Try different price fields
        for field in ['price', 'close', 'last', 'mid']:
            if field in payload:
                return float(payload[field])
        
        # For quote data, use midpoint
        if 'bid' in payload and 'ask' in payload:
            bid = float(payload['bid'])
            ask = float(payload['ask'])
            if bid > 0 and ask > 0:
                return (bid + ask) / 2
        
        return None
    
    def _update_price_history(self, symbol: str, price: float, timestamp: datetime) -> None:
        """Update price history for symbol."""
        if symbol not in self.price_history:
            self.price_history[symbol] = []
        
        price_data = {
            'price': price,
            'timestamp': timestamp
        }
        
        self.price_history[symbol].append(price_data)
        
        # Keep only needed data (long_period + buffer)
        max_history = self.long_period + 10
        if len(self.price_history[symbol]) > max_history:
            self.price_history[symbol] = self.price_history[symbol][-max_history:]
    
    def _calculate_moving_averages(self, symbol: str) -> tuple:
        """Calculate current moving averages for symbol."""
        if symbol not in self.price_history:
            return None, None
        
        prices = [p['price'] for p in self.price_history[symbol]]
        
        if len(prices) < self.long_period:
            return None, None
        
        # Calculate MAs
        short_ma = sum(prices[-self.short_period:]) / self.short_period
        long_ma = sum(prices[-self.long_period:]) / self.long_period
        
        return short_ma, long_ma
    
    def _get_previous_moving_averages(self, symbol: str) -> tuple:
        """Get previous period moving averages for crossover detection."""
        if symbol not in self.price_history:
            return None, None
        
        prices = [p['price'] for p in self.price_history[symbol]]
        
        if len(prices) < self.long_period + 1:
            return None, None
        
        # Calculate MAs using data up to previous period
        prev_prices = prices[:-1]
        
        if len(prev_prices) < self.long_period:
            return None, None
        
        prev_short_ma = sum(prev_prices[-self.short_period:]) / self.short_period
        prev_long_ma = sum(prev_prices[-self.long_period:]) / self.long_period
        
        return prev_short_ma, prev_long_ma
    
    def _detect_crossover(
        self, 
        symbol: str, 
        price: float,
        short_ma: float, 
        long_ma: float, 
        prev_short_ma: float, 
        prev_long_ma: float,
        timestamp: datetime
    ) -> Optional[TradeSignal]:
        """Detect crossover and generate signal if appropriate."""
        
        # Check for minimum time between signals (prevent spam)
        if symbol in self.last_signal_time:
            time_since_last = timestamp - self.last_signal_time[symbol]
            if time_since_last < timedelta(minutes=5):
                return None
        
        signal = None
        
        # Bullish crossover: short MA crosses above long MA
        if prev_short_ma <= prev_long_ma and short_ma > long_ma:
            confidence = self._calculate_signal_confidence(
                price, short_ma, long_ma, "bullish"
            )
            
            if confidence >= self.min_confidence:
                signal = create_trade_signal(
                    symbol=symbol,
                    side=Side.BUY,
                    qty=self._calculate_position_size(confidence),
                    source=SignalSource.STRATEGY,
                    confidence=confidence,
                    strategy_name=self.name,
                    order_type=OrderType.MARKET,
                    metadata={
                        'short_ma': short_ma,
                        'long_ma': long_ma,
                        'price': price,
                        'crossover_type': 'bullish'
                    }
                )
        
        # Bearish crossover: short MA crosses below long MA
        elif prev_short_ma >= prev_long_ma and short_ma < long_ma:
            confidence = self._calculate_signal_confidence(
                price, short_ma, long_ma, "bearish"
            )
            
            if confidence >= self.min_confidence:
                signal = create_trade_signal(
                    symbol=symbol,
                    side=Side.SELL,
                    qty=self._calculate_position_size(confidence),
                    source=SignalSource.STRATEGY,
                    confidence=confidence,
                    strategy_name=self.name,
                    order_type=OrderType.MARKET,
                    metadata={
                        'short_ma': short_ma,
                        'long_ma': long_ma,
                        'price': price,
                        'crossover_type': 'bearish'
                    }
                )
        
        if signal:
            self.last_signal_time[symbol] = timestamp
            self.logger.info(
                f"MA crossover detected for {symbol}: {signal.side.value} "
                f"signal with confidence {confidence:.2f}"
            )
        
        return signal
    
    def _calculate_signal_confidence(
        self, 
        price: float, 
        short_ma: float, 
        long_ma: float, 
        crossover_type: str
    ) -> float:
        """Calculate confidence score for the signal."""
        
        # Base confidence
        base_confidence = 0.5
        
        # Factor 1: Gap between MAs (larger gap = higher confidence)
        ma_gap = abs(short_ma - long_ma) / long_ma
        gap_factor = min(ma_gap * 10, 0.3)  # Cap at 0.3
        
        # Factor 2: Distance of price from MAs
        if crossover_type == "bullish":
            price_factor = min((price - long_ma) / long_ma * 5, 0.2) if price > long_ma else 0
        else:
            price_factor = min((long_ma - price) / long_ma * 5, 0.2) if price < long_ma else 0
        
        confidence = base_confidence + gap_factor + price_factor
        return min(confidence, 1.0)
    
    def _calculate_position_size(self, confidence: float) -> int:
        """Calculate position size based on confidence."""
        # Base position size, scaled by confidence
        base_size = 100
        size_multiplier = 0.5 + (confidence * 0.5)  # 0.5x to 1.0x based on confidence
        
        return max(1, int(base_size * size_multiplier))