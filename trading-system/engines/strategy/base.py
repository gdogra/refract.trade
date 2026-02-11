"""
Base strategy interface and engine.

Strategies consume market events and produce trade signals.
All strategy logic is isolated here - no broker or execution logic.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Callable, Set
from datetime import datetime
import logging
import asyncio

from domain.models import TradeSignal, MarketEvent, SignalSource
from domain.simple_events import DomainEvent, create_signal_generated_event


class BaseStrategy(ABC):
    """
    Abstract base class for trading strategies.
    
    Strategies are stateless between market events.
    All state must be stored externally or reconstructed from market data.
    """
    
    def __init__(self, name: str, symbols: List[str]):
        self.name = name
        self.symbols = set(symbols)  # Convert to set for fast lookup
        self.is_active = True
        self.logger = logging.getLogger(f"{__name__}.{name}")
    
    @abstractmethod
    async def process_market_event(self, event: MarketEvent) -> List[TradeSignal]:
        """
        Process a market event and generate trade signals.
        
        Args:
            event: Market event to process
            
        Returns:
            List of generated trade signals (can be empty)
        """
        pass
    
    @abstractmethod
    def get_required_symbols(self) -> Set[str]:
        """
        Get symbols this strategy requires for market data.
        
        Returns:
            Set of required symbols
        """
        pass
    
    def activate(self):
        """Activate the strategy."""
        self.is_active = True
        self.logger.info(f"Strategy {self.name} activated")
    
    def deactivate(self):
        """Deactivate the strategy."""
        self.is_active = False
        self.logger.info(f"Strategy {self.name} deactivated")
    
    def is_symbol_relevant(self, symbol: str) -> bool:
        """Check if symbol is relevant to this strategy."""
        return symbol in self.symbols


class StrategyEngine:
    """
    Engine that manages multiple strategies and routes market events.
    
    Processes market events and generates signals through registered strategies.
    Publishes signal events for downstream processing.
    """
    
    def __init__(self, event_publisher: Callable[[DomainEvent], None]):
        self.strategies: Dict[str, BaseStrategy] = {}
        self.event_publisher = event_publisher
        self.logger = logging.getLogger(__name__)
        self.is_running = False
    
    def register_strategy(self, strategy: BaseStrategy) -> None:
        """
        Register a trading strategy.
        
        Args:
            strategy: Strategy instance to register
        """
        if strategy.name in self.strategies:
            raise ValueError(f"Strategy {strategy.name} already registered")
        
        self.strategies[strategy.name] = strategy
        self.logger.info(f"Registered strategy: {strategy.name}")
    
    def unregister_strategy(self, strategy_name: str) -> None:
        """
        Unregister a trading strategy.
        
        Args:
            strategy_name: Name of strategy to remove
        """
        if strategy_name in self.strategies:
            del self.strategies[strategy_name]
            self.logger.info(f"Unregistered strategy: {strategy_name}")
    
    def get_strategy(self, name: str) -> Optional[BaseStrategy]:
        """Get strategy by name."""
        return self.strategies.get(name)
    
    def list_strategies(self) -> List[str]:
        """List all registered strategy names."""
        return list(self.strategies.keys())
    
    def get_required_symbols(self) -> Set[str]:
        """Get all symbols required by active strategies."""
        symbols = set()
        for strategy in self.strategies.values():
            if strategy.is_active:
                symbols.update(strategy.get_required_symbols())
        return symbols
    
    async def process_market_event(self, event: MarketEvent) -> None:
        """
        Process market event through all active strategies.
        
        Args:
            event: Market event to process
        """
        if not self.is_running:
            return
        
        # Process event through each active strategy
        for strategy in self.strategies.values():
            if not strategy.is_active:
                continue
            
            # Skip if strategy doesn't care about this symbol
            if not strategy.is_symbol_relevant(event.symbol):
                continue
            
            try:
                # Generate signals from strategy
                signals = await strategy.process_market_event(event)
                
                # Publish signal events
                for signal in signals:
                    signal_event = create_signal_generated_event(signal, strategy.name)
                    self.event_publisher(signal_event)
                    
                    self.logger.info(
                        f"Signal generated: {signal.symbol} {signal.side.value} "
                        f"{signal.qty} (confidence: {signal.confidence:.2f}) "
                        f"by {strategy.name}"
                    )
                    
            except Exception as e:
                self.logger.error(f"Error in strategy {strategy.name}: {e}")
    
    def start(self) -> None:
        """Start the strategy engine."""
        self.is_running = True
        self.logger.info("Strategy engine started")
    
    def stop(self) -> None:
        """Stop the strategy engine."""
        self.is_running = False
        self.logger.info("Strategy engine stopped")
    
    async def handle_market_data_received_event(self, event: DomainEvent) -> None:
        """Handle market data received events."""
        if 'symbol' in event.metadata and 'payload' in event.metadata:
            market_event = MarketEvent(
                type=event.metadata.get('data_type', 'tick'),
                symbol=event.metadata['symbol'],
                timestamp=event.timestamp,
                payload=event.metadata['payload']
            )
            await self.process_market_event(market_event)