#!/usr/bin/env python3
"""
Simple test script to verify the trading system works.
"""

import os
import asyncio
import logging
from datetime import datetime

# Set environment variables
os.environ['ALPACA_API_KEY'] = 'PKFN5RA47L4EYOD2CJVCK4B5FE'
os.environ['ALPACA_SECRET_KEY'] = '3My6ZYjHD6mN8gbVq5Q2YBnGkWXYaTbd6r9oUrhXN3dk'
os.environ['ALPACA_BASE_URL'] = 'https://paper-api.alpaca.markets'
os.environ['TRADING_API_KEY'] = 'tr4d1ng_s3cur3_k3y_2024_r4nd0m_str1ng'

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import trading system components
from adapters.brokers.alpaca import AlpacaBrokerAdapter
from engines.strategy.base import StrategyEngine
from engines.strategy.ma_crossover import MovingAverageCrossoverStrategy
from engines.risk.engine import RiskEngine
from engines.execution.engine import ExecutionEngine
from domain.simple_events import DomainEvent
from domain.models import MarketEvent, MarketEventType

async def test_trading_system():
    """Test the complete trading system flow."""
    
    print("🚀 Starting Trading System Test")
    
    # Event storage for testing
    events = []
    
    def publish_event(event: DomainEvent):
        events.append(event)
        print(f"📡 Event: {event.event_type.value}")
    
    try:
        # 1. Initialize broker
        print("\n1️⃣ Testing broker connection...")
        broker = AlpacaBrokerAdapter()
        connected = await broker.connect()
        
        if not connected:
            print("❌ Broker connection failed")
            return
        
        account = await broker.get_account()
        positions = await broker.get_positions()
        
        print(f"✅ Broker connected")
        print(f"   Account: ${account.equity}")
        print(f"   Positions: {len(positions)}")
        
        # 2. Initialize engines
        print("\n2️⃣ Initializing engines...")
        strategy_engine = StrategyEngine(publish_event)
        risk_engine = RiskEngine(publish_event)
        execution_engine = ExecutionEngine(broker, publish_event)
        
        await execution_engine.initialize()
        strategy_engine.start()
        
        print("✅ All engines initialized")
        
        # 3. Register strategy
        print("\n3️⃣ Registering MA crossover strategy...")
        ma_strategy = MovingAverageCrossoverStrategy(
            symbols=["SPY"], 
            short_period=5,   # Short periods for faster testing
            long_period=10,
            min_confidence=0.6
        )
        strategy_engine.register_strategy(ma_strategy)
        print("✅ Strategy registered")
        
        # 4. Simulate market events
        print("\n4️⃣ Simulating market events...")
        
        # Simulate price data to trigger MA crossover
        test_prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112]
        
        for i, price in enumerate(test_prices):
            market_event = MarketEvent(
                type=MarketEventType.TICK,
                symbol="SPY",
                timestamp=datetime.utcnow(),
                payload={"price": price, "volume": 1000}
            )
            
            await strategy_engine.process_market_event(market_event)
            print(f"   📈 Processed price: ${price}")
            
            # Small delay between events
            await asyncio.sleep(0.1)
        
        # 5. Test risk engine with a mock signal
        print("\n5️⃣ Testing risk validation...")
        
        # Check if any signals were generated
        signal_events = [e for e in events if e.event_type.value == 'signal_generated']
        print(f"   Generated {len(signal_events)} signals")
        
        if signal_events:
            # Test risk validation
            for signal_event in signal_events:
                signal = signal_event.signal
                approved_trade, rejected_trade = await risk_engine.validate_signal(
                    signal, account, positions
                )
                
                if approved_trade:
                    print(f"   ✅ Signal approved: {signal.symbol} {signal.side.value} {signal.qty}")
                    
                    # Test execution (in paper trading)
                    await execution_engine.execute_approved_trade(approved_trade)
                    print(f"   🎯 Trade executed")
                    
                else:
                    print(f"   ❌ Signal rejected: {rejected_trade.rejection_reason}")
        
        # 6. Show results
        print("\n6️⃣ Test Results:")
        print(f"   📊 Total events generated: {len(events)}")
        print(f"   💼 Current account equity: ${account.equity}")
        print(f"   ⚖️  Risk engine status: {'Active' if risk_engine.is_active else 'Inactive'}")
        print(f"   🔄 Strategy engine status: {'Running' if strategy_engine.is_running else 'Stopped'}")
        
        active_orders = execution_engine.get_active_orders()
        print(f"   📋 Active orders: {len(active_orders)}")
        
        # Cleanup
        await execution_engine.shutdown()
        strategy_engine.stop()
        await broker.disconnect()
        
        print("\n✅ Trading system test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_trading_system())