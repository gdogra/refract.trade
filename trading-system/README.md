# Production Trading System

A production-grade, modular trading system with strict architectural boundaries and event-driven design.

## Architecture Overview

The system implements a clean separation between strategy logic, risk management, execution, and AI advisory services with the following core principles:

- **Deterministic execution** through event-driven architecture
- **AI is advisory only** - no direct execution capabilities  
- **Broker abstraction** allows swapping brokers without code changes
- **Everything is auditable** through comprehensive event logging
- **Risk engine is mandatory** - all signals must pass risk validation

## Core Components

### 1. Domain Models (`domain/`)
- **TradeSignal**: Core trading instruction from strategies or AI
- **TradeIdea**: AI-generated suggestion requiring human approval
- **Events**: Domain events for system communication
- **Value Objects**: Account snapshots, positions, market data

### 2. Strategy Engine (`engines/strategy/`)
- Consumes market events and generates TradeSignals
- Stateless between ticks - all state stored externally
- Example implementation: Moving Average Crossover
- **CANNOT** access broker APIs directly

### 3. Risk Engine (`engines/risk/`)
- **MANDATORY GATE** for all trade execution
- Validates signals against configurable rules:
  - Max 5% account equity per position
  - Max 2 open positions per symbol
  - No duplicate signals within 60s
  - Market hours validation
  - Minimum confidence thresholds
- Produces ApprovedTrade or RejectedTrade

### 4. Execution Engine (`engines/execution/`)
- **ONLY** component allowed to call broker APIs
- Converts ApprovedTrade → broker orders
- Monitors order lifecycle and publishes events
- Handles order fills, rejections, and cancellations

### 5. AI Advisor Service (`services/ai/`)
- **ADVISORY ONLY** - cannot execute trades
- Analyzes portfolio risk and market conditions
- Generates TradeIdeas requiring human approval
- Provides trading education and insights
- **CANNOT** access broker APIs

### 6. Broker Adapter (`adapters/brokers/`)
- Abstract interface for broker interactions
- Alpaca implementation provided (paper trading default)
- Swappable without affecting other components

### 7. Audit Logger (`persistence/`)
- Comprehensive event logging for compliance
- PostgreSQL-based append-only event store
- Tracks all signals, decisions, and order events

## Setup Instructions

### Prerequisites
- Python 3.11+
- PostgreSQL database
- Alpaca Markets account (paper trading supported)
- OpenAI API key (for AI features)

### Installation

1. Clone and setup environment:
```bash
cd trading-system
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
# Required
export ALPACA_API_KEY="your_alpaca_key"
export ALPACA_SECRET_KEY="your_alpaca_secret"  
export DATABASE_URL="postgresql://user:pass@localhost/trading_db"
export TRADING_API_KEY="your_secure_api_key"

# Optional - for AI features
export OPENAI_API_KEY="your_openai_key"

# Optional - defaults to paper trading
export ALPACA_BASE_URL="https://paper-api.alpaca.markets"
```

3. Setup database:
```bash
# Create PostgreSQL database
createdb trading_db

# Tables will be created automatically on first run
```

### Running the System

Start the FastAPI server:
```bash
python api/main.py
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Usage

### Authentication
All endpoints require Bearer token authentication:
```bash
curl -H "Authorization: Bearer YOUR_TRADING_API_KEY" http://localhost:8000/status
```

### Key Endpoints

**System Status:**
```bash
GET /status - System health and component status
GET /health - Simple health check
```

**Strategy Management:**
```bash
GET /strategies - List registered strategies
POST /strategies/{name}/activate - Activate strategy
POST /strategies/{name}/deactivate - Deactivate strategy
```

**Risk Management:**
```bash
GET /risk/status - Risk engine status and rules
POST /risk/activate - Activate risk engine
POST /risk/deactivate - Deactivate risk engine (DANGEROUS)
```

**Execution:**
```bash
GET /execution/status - Execution engine status
GET /execution/orders - Active orders
GET /execution/history - Order history
```

**Portfolio:**
```bash
GET /account - Account information
GET /positions - Current positions
```

**AI Advisory (Phase 2):**
```bash
POST /ai/analyze - Get AI analysis
POST /ai/ideas/{id}/action - Approve/reject AI trade ideas
```

**Testing:**
```bash
POST /market/simulate - Simulate market event for testing
```

## Execution Flow

### Phase 1: Automated Strategy Trading

1. **Market Data** → Strategy Engine
2. **Strategy** generates TradeSignal
3. **TradeSignal** → Risk Engine validation
4. **Risk Engine** produces ApprovedTrade or RejectedTrade  
5. **ApprovedTrade** → Execution Engine
6. **Execution Engine** → Broker API → Order placement
7. **All events logged** to audit trail

### Phase 2: AI Advisory Flow

1. **User requests AI analysis** via API
2. **AI Advisor** analyzes portfolio + market data
3. **AI generates TradeIdeas** (suggestions only)
4. **User reviews and approves/rejects** ideas
5. **Approved ideas** converted to TradeSignals
6. **Continue with Phase 1 flow** for execution

## Safety Features

### Risk Controls
- Maximum position size limits (5% default)
- Position count limits per symbol  
- Confidence thresholds for signals
- Market hours validation
- Duplicate signal prevention

### AI Safety
- AI cannot execute trades directly
- All AI suggestions require human approval
- Conservative prompting with risk warnings
- Educational focus over trade recommendations

### Audit Trail
- All events logged with timestamps
- Immutable audit trail in PostgreSQL
- Risk decisions tracked with reasoning
- Order lifecycle fully auditable

## Configuration

### Risk Rules
Risk rules can be customized in `engines/risk/engine.py`:
```python
self.add_rule(MaxPositionSizeRule(max_position_pct=0.05))  # 5% max
self.add_rule(MaxPositionsPerSymbolRule(max_positions=2))  # 2 per symbol
self.add_rule(MinConfidenceRule(min_confidence=0.6))       # 60% min confidence
```

### Strategy Parameters  
Strategy parameters in `engines/strategy/ma_crossover.py`:
```python
MovingAverageCrossoverStrategy(
    symbols=["SPY", "QQQ", "IWM"],
    short_period=20,   # 20-period MA
    long_period=50,    # 50-period MA
    min_confidence=0.6 # 60% minimum confidence
)
```

## Development

### Adding New Strategies
1. Inherit from `BaseStrategy`
2. Implement `process_market_event()` 
3. Implement `get_required_symbols()`
4. Register in `api/main.py`

### Adding New Risk Rules
1. Inherit from `RiskRule`
2. Implement `validate()` method
3. Add to `RiskEngine._setup_default_rules()`

### Testing
```bash
# Run tests
pytest

# Test with simulated market data
curl -X POST "http://localhost:8000/market/simulate?symbol=SPY&price=450.00" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Production Deployment

### Environment Setup
- Use live Alpaca credentials for production
- Configure robust PostgreSQL instance
- Set secure API keys
- Enable proper logging levels

### Monitoring
- Monitor `/status` endpoint
- Set up alerts for risk engine deactivation
- Track order fill rates and execution latency
- Monitor AI suggestion approval rates

### Security
- Use strong API keys and rotate regularly
- Limit API access to trusted IPs
- Enable database connection encryption
- Audit access logs regularly

## License

This trading system is for educational and personal use. Trading involves substantial risk and may not be suitable for all investors.