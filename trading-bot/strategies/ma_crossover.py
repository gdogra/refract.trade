from datetime import datetime
from typing import List
import pandas as pd
import numpy as np
from strategies.base import BaseStrategy
from models.trade_signal import TradeSignal, Side, OrderType


class MovingAverageCrossover(BaseStrategy):
    """
    Moving Average Crossover Strategy
    
    Generates buy signals when short MA crosses above long MA
    Generates sell signals when short MA crosses below long MA
    """
    
    def __init__(self, symbols: List[str], short_window: int = 20, long_window: int = 50):
        super().__init__("MA_Crossover", symbols)
        self.short_window = short_window
        self.long_window = long_window
        self.last_signals = {}  # Track last signal time per symbol
        
    async def generate_signals(self, market_data: dict) -> List[TradeSignal]:
        """Generate signals based on MA crossover."""
        signals = []
        
        for symbol in self.symbols:
            if symbol not in market_data:
                continue
                
            df = market_data[symbol]
            if len(df) < self.long_window:
                continue  # Not enough data
                
            # Calculate moving averages
            df[f'MA_{self.short_window}'] = df['close'].rolling(window=self.short_window).mean()
            df[f'MA_{self.long_window}'] = df['close'].rolling(window=self.long_window).mean()
            
            # Get recent data
            current = df.iloc[-1]
            previous = df.iloc[-2]
            
            short_ma_current = current[f'MA_{self.short_window}']
            long_ma_current = current[f'MA_{self.long_window}']
            short_ma_previous = previous[f'MA_{self.short_window}']
            long_ma_previous = previous[f'MA_{self.long_window}']
            
            # Skip if MAs are not valid (NaN)
            if pd.isna(short_ma_current) or pd.isna(long_ma_current):
                continue
                
            signal = None
            confidence = 0.0
            
            # Bullish crossover: short MA crosses above long MA
            if (short_ma_previous <= long_ma_previous and 
                short_ma_current > long_ma_current):
                
                # Calculate confidence based on gap between MAs and volume
                ma_gap = abs(short_ma_current - long_ma_current) / long_ma_current
                volume_factor = min(current['volume'] / df['volume'].rolling(20).mean(), 2.0)
                confidence = min(0.5 + ma_gap * 10 + (volume_factor - 1) * 0.2, 1.0)
                
                signal = TradeSignal(
                    symbol=symbol,
                    side=Side.BUY,
                    qty=self.calculate_position_size(symbol, confidence, 100000),  # Assume $100k account
                    order_type=OrderType.MARKET,
                    confidence=confidence,
                    timestamp=datetime.now(),
                    strategy=self.name,
                    metadata={
                        'short_ma': short_ma_current,
                        'long_ma': long_ma_current,
                        'price': current['close'],
                        'volume': current['volume']
                    }
                )
                
            # Bearish crossover: short MA crosses below long MA
            elif (short_ma_previous >= long_ma_previous and 
                  short_ma_current < long_ma_current):
                
                # Calculate confidence for sell signal
                ma_gap = abs(short_ma_current - long_ma_current) / long_ma_current
                volume_factor = min(current['volume'] / df['volume'].rolling(20).mean(), 2.0)
                confidence = min(0.5 + ma_gap * 10 + (volume_factor - 1) * 0.2, 1.0)
                
                signal = TradeSignal(
                    symbol=symbol,
                    side=Side.SELL,
                    qty=self.calculate_position_size(symbol, confidence, 100000),
                    order_type=OrderType.MARKET,
                    confidence=confidence,
                    timestamp=datetime.now(),
                    strategy=self.name,
                    metadata={
                        'short_ma': short_ma_current,
                        'long_ma': long_ma_current,
                        'price': current['close'],
                        'volume': current['volume']
                    }
                )
            
            if signal:
                self.last_signals[symbol] = datetime.now()
                signals.append(signal)
                
        return signals
    
    def get_required_indicators(self) -> List[str]:
        """Return required indicators for this strategy."""
        return [f'MA_{self.short_window}', f'MA_{self.long_window}', 'volume']
    
    def calculate_position_size(self, symbol: str, confidence: float, account_equity: float) -> int:
        """Calculate position size for MA crossover strategy."""
        # Risk 2% of equity, scaled by confidence
        risk_amount = account_equity * 0.02 * confidence
        
        # Minimum position of 1 share, maximum 5% of account
        max_position_value = account_equity * 0.05
        
        # Assuming average price of $100 - in real implementation, use current market price
        estimated_price = 100
        max_shares = int(max_position_value / estimated_price)
        target_shares = int(risk_amount / estimated_price)
        
        return max(1, min(target_shares, max_shares))