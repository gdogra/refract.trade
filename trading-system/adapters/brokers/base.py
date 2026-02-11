"""
Abstract broker adapter interface.

Defines the contract that all broker implementations must follow.
Ensures broker can be swapped without affecting other system components.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Callable, Optional
from decimal import Decimal
from datetime import datetime

from domain.models import (
    TradeSignal, PositionSnapshot, AccountSnapshot, 
    OrderEvent, MarketEvent
)


class BrokerAdapter(ABC):
    """
    Abstract interface for broker interactions.
    
    All broker implementations must implement these methods.
    No strategy or AI logic allowed - pure data access only.
    """
    
    @abstractmethod
    async def connect(self) -> bool:
        """
        Establish connection to broker.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Close broker connection and cleanup resources."""
        pass
    
    @abstractmethod
    async def is_connected(self) -> bool:
        """Check if broker connection is active."""
        pass
    
    @abstractmethod
    async def get_account(self) -> AccountSnapshot:
        """
        Get current account information.
        
        Returns:
            AccountSnapshot: Current account state
        """
        pass
    
    @abstractmethod
    async def get_positions(self) -> List[PositionSnapshot]:
        """
        Get all current positions.
        
        Returns:
            List[PositionSnapshot]: All open positions
        """
        pass
    
    @abstractmethod
    async def get_position(self, symbol: str) -> Optional[PositionSnapshot]:
        """
        Get position for specific symbol.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            PositionSnapshot or None if no position
        """
        pass
    
    @abstractmethod
    async def place_order(self, signal: TradeSignal) -> OrderEvent:
        """
        Place order with broker.
        
        Args:
            signal: Approved trade signal
            
        Returns:
            OrderEvent: Order submission result
        """
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> OrderEvent:
        """
        Cancel an existing order.
        
        Args:
            order_id: Broker's order ID
            
        Returns:
            OrderEvent: Cancellation result
        """
        pass
    
    @abstractmethod
    async def get_order_status(self, order_id: str) -> OrderEvent:
        """
        Get current status of an order.
        
        Args:
            order_id: Broker's order ID
            
        Returns:
            OrderEvent: Current order status
        """
        pass
    
    @abstractmethod
    async def stream_market_data(
        self, 
        symbols: List[str], 
        callback: Callable[[MarketEvent], None]
    ) -> None:
        """
        Stream real-time market data.
        
        Args:
            symbols: List of symbols to stream
            callback: Function to call with market events
        """
        pass
    
    @abstractmethod
    async def get_market_hours(self) -> Dict[str, Any]:
        """
        Get market hours and status.
        
        Returns:
            Dict containing market open/close times and current status
        """
        pass
    
    @abstractmethod
    async def get_current_price(self, symbol: str) -> Optional[Decimal]:
        """
        Get current market price for symbol.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Current price or None if not available
        """
        pass


class BrokerError(Exception):
    """Base exception for broker-related errors."""
    pass


class ConnectionError(BrokerError):
    """Raised when broker connection fails."""
    pass


class OrderError(BrokerError):
    """Raised when order placement fails."""
    pass


class MarketDataError(BrokerError):
    """Raised when market data is unavailable."""
    pass