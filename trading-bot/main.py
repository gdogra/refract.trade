#!/usr/bin/env python3
"""
Main orchestration file for the Refract.trade Trading Bot.

This file coordinates all components:
- Strategy Engine (generates signals)
- Risk Engine (validates trades)
- Broker Adapter (executes orders)
- Database Logger (records decisions)
"""

import asyncio
import logging
import signal
import sys
from datetime import datetime
from typing import Dict, List

from dotenv import load_dotenv

from engines.strategy_engine import StrategyEngine
from engines.risk_engine import RiskEngine
from adapters.alpaca_adapter import AlpacaAdapter
from strategies.ma_crossover import MovingAverageCrossover
from utils.database import DatabaseLogger


class TradingBot:
    """
    Main trading bot orchestrator.
    
    Coordinates strategy execution, risk management, and order placement.
    """
    
    def __init__(self):
        self.strategy_engine = StrategyEngine()
        self.risk_engine = RiskEngine()
        self.broker = AlpacaAdapter()
        self.db_logger = DatabaseLogger()
        self.logger = logging.getLogger(__name__)
        
        self.is_running = False
        self.symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'SPY']  # Default watchlist
        
    async def initialize(self):
        """Initialize all components."""
        self.logger.info("Initializing trading bot...")
        
        # Initialize database
        await self.db_logger.initialize()
        
        # Connect to broker
        connected = await self.broker.connect()
        if not connected:
            raise RuntimeError("Failed to connect to broker")
            
        # Add strategies
        ma_strategy = MovingAverageCrossover(self.symbols, short_window=20, long_window=50)
        self.strategy_engine.add_strategy(ma_strategy)
        
        # Load historical data for strategies
        await self._load_initial_data()
        
        self.logger.info("Trading bot initialized successfully")
        await self.db_logger.log_system_event("BOT_INITIALIZED", "Trading bot started", {
            'symbols': self.symbols,
            'strategies': [s.name for s in self.strategy_engine.strategies]
        })
        
    async def _load_initial_data(self):
        """Load initial historical data for all symbols."""
        self.logger.info(f"Loading historical data for {len(self.symbols)} symbols...")
        
        for symbol in self.symbols:
            try:
                df = await self.broker.get_historical_data(symbol, days=100)
                await self.strategy_engine.update_market_data(symbol, df)
                self.logger.info(f"Loaded {len(df)} days of data for {symbol}")
            except Exception as e:
                self.logger.error(f"Failed to load data for {symbol}: {e}")
                
    async def run(self):
        """Main trading loop."""
        self.is_running = True
        self.logger.info("Starting trading bot main loop...")
        
        try:
            # Start strategy engine (generates signals every 60 seconds)
            strategy_task = asyncio.create_task(self._run_strategy_loop())
            
            # Start market data streaming
            stream_task = asyncio.create_task(self._run_market_stream())
            
            # Start monitoring tasks
            monitor_task = asyncio.create_task(self._run_monitoring_loop())
            
            # Wait for tasks to complete (or until shutdown)
            await asyncio.gather(strategy_task, stream_task, monitor_task)
            
        except Exception as e:
            self.logger.error(f"Error in main loop: {e}")
            await self.db_logger.log_error("MAIN_LOOP_ERROR", str(e))
            
    async def _run_strategy_loop(self):
        """Strategy evaluation loop."""
        self.logger.info("Strategy loop started")
        
        while self.is_running:
            try:
                # Generate signals from all strategies
                signals = await self.strategy_engine.generate_all_signals()
                
                if signals:
                    await self._process_signals(signals)
                    
            except Exception as e:
                self.logger.error(f"Strategy loop error: {e}")
                await self.db_logger.log_error("STRATEGY_LOOP_ERROR", str(e))
                
            await asyncio.sleep(60)  # Run every minute
            
    async def _process_signals(self, signals: List):
        """Process generated signals through risk management and execution."""
        self.logger.info(f"Processing {len(signals)} signals...")
        
        # Get current account state
        account_state = await self.broker.get_account_state()
        account_equity = account_state['equity']
        current_positions = await self.broker.get_positions()
        
        for signal in signals:
            try:
                # Validate signal through risk engine
                is_valid, reason = await self.risk_engine.validate_signal(
                    signal, account_equity, current_positions
                )
                
                if is_valid:
                    # Execute the trade
                    order_id = await self.broker.place_order(signal)
                    
                    if order_id:
                        self.logger.info(f"Order executed: {order_id}")
                    else:
                        self.logger.warning(f"Order execution failed for {signal.symbol}")
                        
                else:
                    self.logger.info(f"Signal rejected: {reason}")
                    
            except Exception as e:
                self.logger.error(f"Error processing signal for {signal.symbol}: {e}")
                await self.db_logger.log_error("SIGNAL_PROCESSING_ERROR", 
                                             f"{signal.symbol}: {str(e)}")
                                             
    async def _run_market_stream(self):
        """Market data streaming loop."""
        self.logger.info("Market stream started")
        
        async def handle_market_data(data):
            """Handle incoming market data."""
            # Update strategy engine with new data
            # This is simplified - in practice you'd accumulate ticks into bars
            symbol = data.symbol
            # Convert real-time data to DataFrame format expected by strategies
            # Implementation depends on your data aggregation needs
            
        try:
            await self.broker.stream_market_data(self.symbols, handle_market_data)
        except Exception as e:
            self.logger.error(f"Market stream error: {e}")
            await self.db_logger.log_error("MARKET_STREAM_ERROR", str(e))
            
    async def _run_monitoring_loop(self):
        """System monitoring loop."""
        self.logger.info("Monitoring loop started")
        
        while self.is_running:
            try:
                # Log account state every 5 minutes
                account_state = await self.broker.get_account_state()
                await self.db_logger.log_account_state(account_state)
                
                # Get risk metrics
                positions = await self.broker.get_positions()
                risk_metrics = await self.risk_engine.get_risk_metrics(
                    account_state['equity'], positions
                )
                
                # Log system status
                await self.db_logger.log_system_event("SYSTEM_STATUS", "Periodic health check", {
                    'account_equity': account_state['equity'],
                    'positions_count': len(positions),
                    'market_open': risk_metrics['market_open'],
                    'strategies_active': len([s for s in self.strategy_engine.strategies if s.is_active])
                })
                
                self.logger.info(f"Health check: Equity=${account_state['equity']:.2f}, "
                               f"Positions={len(positions)}, Market={'Open' if risk_metrics['market_open'] else 'Closed'}")
                
            except Exception as e:
                self.logger.error(f"Monitoring error: {e}")
                
            await asyncio.sleep(300)  # Every 5 minutes
            
    async def shutdown(self):
        """Graceful shutdown."""
        self.logger.info("Shutting down trading bot...")
        
        self.is_running = False
        
        # Stop components
        self.strategy_engine.stop()
        await self.broker.disconnect()
        await self.db_logger.close()
        
        await self.db_logger.log_system_event("BOT_SHUTDOWN", "Trading bot stopped", {})
        self.logger.info("Trading bot shutdown complete")
        

def setup_logging():
    """Configure logging for the trading bot."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('trading_bot.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    

async def main():
    """Main entry point."""
    # Load environment variables
    load_dotenv()
    
    # Setup logging
    setup_logging()
    logger = logging.getLogger(__name__)
    
    # Create and initialize bot
    bot = TradingBot()
    
    # Setup signal handlers for graceful shutdown
    def signal_handler(sig, frame):
        logger.info(f"Received signal {sig}, initiating shutdown...")
        asyncio.create_task(bot.shutdown())
        
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await bot.initialize()
        await bot.run()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        await bot.shutdown()
        

if __name__ == "__main__":
    asyncio.run(main())