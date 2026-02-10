import asyncio
import logging
from typing import List, Dict
from datetime import datetime
import pandas as pd

from strategies.base import BaseStrategy
from models.trade_signal import TradeSignal
from utils.database import DatabaseLogger


class StrategyEngine:
    """
    Orchestrates strategy execution and signal generation.
    
    Manages multiple strategies and coordinates their execution.
    """
    
    def __init__(self):
        self.strategies: List[BaseStrategy] = []
        self.market_data: Dict[str, pd.DataFrame] = {}
        self.is_running = False
        self.logger = logging.getLogger(__name__)
        self.db_logger = DatabaseLogger()
        
    def add_strategy(self, strategy: BaseStrategy):
        """Add a strategy to the engine."""
        self.strategies.append(strategy)
        self.logger.info(f"Added strategy: {strategy.name}")
        
    def remove_strategy(self, strategy_name: str):
        """Remove a strategy by name."""
        self.strategies = [s for s in self.strategies if s.name != strategy_name]
        self.logger.info(f"Removed strategy: {strategy_name}")
        
    async def update_market_data(self, symbol: str, data: pd.DataFrame):
        """Update market data for a symbol."""
        self.market_data[symbol] = data
        
    async def generate_all_signals(self) -> List[TradeSignal]:
        """Generate signals from all active strategies."""
        all_signals = []
        
        for strategy in self.strategies:
            if not strategy.is_active:
                continue
                
            try:
                signals = await strategy.generate_signals(self.market_data)
                
                for signal in signals:
                    # Log signal generation
                    await self.db_logger.log_signal_generated(signal, strategy.name)
                    self.logger.info(
                        f"Signal generated: {signal.symbol} {signal.side.value} "
                        f"{signal.qty} shares, confidence: {signal.confidence:.2f}"
                    )
                
                all_signals.extend(signals)
                
            except Exception as e:
                self.logger.error(f"Error generating signals for {strategy.name}: {e}")
                await self.db_logger.log_error(f"Strategy {strategy.name} error", str(e))
                
        return all_signals
        
    async def run_strategies(self, interval_seconds: int = 60):
        """Run strategy evaluation loop."""
        self.is_running = True
        self.logger.info("Strategy engine started")
        
        while self.is_running:
            try:
                signals = await self.generate_all_signals()
                
                if signals:
                    self.logger.info(f"Generated {len(signals)} signals")
                    # Signals will be processed by the main orchestrator
                    yield signals
                    
            except Exception as e:
                self.logger.error(f"Error in strategy loop: {e}")
                await self.db_logger.log_error("Strategy engine error", str(e))
                
            await asyncio.sleep(interval_seconds)
            
    def stop(self):
        """Stop the strategy engine."""
        self.is_running = False
        self.logger.info("Strategy engine stopped")
        
    def get_strategy_status(self) -> Dict[str, dict]:
        """Get status of all strategies."""
        return {
            strategy.name: {
                'active': strategy.is_active,
                'symbols': strategy.symbols,
                'required_indicators': strategy.get_required_indicators()
            }
            for strategy in self.strategies
        }