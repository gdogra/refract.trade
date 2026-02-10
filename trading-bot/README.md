# Refract.trade Trading Bot

A modular trading bot using Alpaca's Trading API with clean separation of concerns.

## Architecture

- **StrategyEngine**: Generates trading signals based on technical analysis
- **RiskEngine**: Validates trades against risk parameters
- **BrokerAdapter**: Interfaces with Alpaca API for order execution
- **PostgreSQL**: Logs all decisions and trades

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables:
   ```bash
   export ALPACA_API_KEY="your_api_key"
   export ALPACA_SECRET_KEY="your_secret_key" 
   export DATABASE_URL="postgresql://user:pass@host/db"
   ```

3. Run the bot:
   ```bash
   python main.py
   ```

## Project Structure

```
trading-bot/
├── main.py                 # Orchestration and main loop
├── requirements.txt        # Python dependencies
├── strategies/
│   ├── __init__.py
│   ├── base.py            # Base strategy class
│   └── ma_crossover.py    # Moving average crossover strategy
├── engines/
│   ├── __init__.py
│   ├── strategy_engine.py # Strategy execution engine
│   └── risk_engine.py     # Risk management engine
├── adapters/
│   ├── __init__.py
│   └── alpaca_adapter.py  # Alpaca broker adapter
├── models/
│   ├── __init__.py
│   └── trade_signal.py    # TradeSignal data model
└── utils/
    ├── __init__.py
    └── database.py        # Database utilities
```