from abc import ABC, abstractmethod
from typing import List, Optional
import pandas as pd
from models.trade_signal import TradeSignal


class BaseStrategy(ABC):
    """
    Base class for all trading strategies.
    
    Strategies should inherit from this class and implement the generate_signals method.
    """
    
    def __init__(self, name: str, symbols: List[str]):
        self.name = name
        self.symbols = symbols
        self.is_active = True
        
    @abstractmethod
    async def generate_signals(self, market_data: dict) -> List[TradeSignal]:
        """
        Generate trading signals based on market data.
        
        Args:
            market_data: Dict containing price data keyed by symbol
            
        Returns:
            List of TradeSignal objects
        """
        pass
    
    @abstractmethod
    def get_required_indicators(self) -> List[str]:
        """
        Return list of technical indicators required by this strategy.
        
        Returns:
            List of indicator names (e.g., ['SMA_20', 'SMA_50', 'RSI'])
        """
        pass
    
    def activate(self):
        """Activate the strategy."""
        self.is_active = True
    
    def deactivate(self):
        """Deactivate the strategy."""
        self.is_active = False
    
    def calculate_position_size(self, symbol: str, confidence: float, account_equity: float) -> int:
        """
        Calculate position size based on confidence and account equity.
        
        Args:
            symbol: Stock symbol
            confidence: Signal confidence (0.0 to 1.0)
            account_equity: Total account value
            
        Returns:
            Number of shares to trade
        """
        # Base implementation: risk 1% of equity, scaled by confidence
        risk_amount = account_equity * 0.01 * confidence
        
        # This is a simplified calculation - in practice you'd need current price
        # and implement proper position sizing algorithms
        return max(1, int(risk_amount / 100))  # Assuming $100 per share average