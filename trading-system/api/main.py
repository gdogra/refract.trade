"""
Main FastAPI application for the trading system.

Provides REST endpoints following the strict architectural boundaries:
- Phase 1: Strategy-based automated trading
- Phase 2: AI advisory (non-executing) interface

All endpoints respect the domain isolation rules.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
import logging
import os
from datetime import datetime
from contextlib import asynccontextmanager

# Import domain models and events
from domain.models import *
from domain.simple_events import *

# Import engine and service components
from engines.strategy.base import StrategyEngine
from engines.strategy.ma_crossover import MovingAverageCrossoverStrategy
from engines.risk.engine import RiskEngine
from engines.execution.engine import ExecutionEngine
from services.ai.advisor import AIAdvisorService
from adapters.brokers.alpaca import AlpacaBrokerAdapter


# Global system components
trading_system = {
    "broker": None,
    "strategy_engine": None,
    "risk_engine": None,
    "execution_engine": None,
    "ai_advisor": None,
    "event_publisher": None,
    "event_log": []
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup trading system components."""
    logger = logging.getLogger(__name__)
    
    try:
        # Initialize event publisher
        def publish_event(event: DomainEvent):
            trading_system["event_log"].append(event)
            logger.info(f"Event published: {event.event_type.value}")
        
        trading_system["event_publisher"] = publish_event
        
        # Initialize broker adapter
        trading_system["broker"] = AlpacaBrokerAdapter()
        
        # Initialize engines
        trading_system["strategy_engine"] = StrategyEngine(publish_event)
        trading_system["risk_engine"] = RiskEngine(publish_event)
        trading_system["execution_engine"] = ExecutionEngine(
            trading_system["broker"], publish_event
        )
        trading_system["ai_advisor"] = AIAdvisorService(publish_event)
        
        # Connect broker and start engines
        await trading_system["execution_engine"].initialize()
        trading_system["strategy_engine"].start()
        
        # Register example strategy
        ma_strategy = MovingAverageCrossoverStrategy(
            symbols=["SPY", "QQQ", "IWM"], 
            short_period=20, 
            long_period=50
        )
        trading_system["strategy_engine"].register_strategy(ma_strategy)
        
        logger.info("Trading system initialized successfully")
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize trading system: {e}")
        raise
    
    finally:
        # Cleanup
        if trading_system["execution_engine"]:
            await trading_system["execution_engine"].shutdown()
        if trading_system["strategy_engine"]:
            trading_system["strategy_engine"].stop()
        logger.info("Trading system shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Production Trading System API",
    description="Event-driven trading system with strict domain isolation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Pydantic models for API
class SystemStatusResponse(BaseModel):
    status: str
    timestamp: str
    components: Dict[str, Any]


class StrategyListResponse(BaseModel):
    strategies: List[str]
    active_count: int


class RiskStatusResponse(BaseModel):
    is_active: bool
    rules: List[str]
    statistics: Dict[str, Any]


class ExecutionStatusResponse(BaseModel):
    status: str
    active_orders: int
    statistics: Dict[str, Any]


class AIAnalysisRequest(BaseModel):
    analysis_type: str = Field(..., description="portfolio_risk, trade_ideas, options_analysis, or question")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    question: Optional[str] = Field(None, description="Question for Q&A analysis")


class AIAnalysisResponse(BaseModel):
    analysis_type: str
    result: Dict[str, Any]
    timestamp: str


class TradeIdeaActionRequest(BaseModel):
    action: str = Field(..., description="approve or reject")
    notes: Optional[str] = None


# Authentication
async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key for system access."""
    expected_key = os.getenv('TRADING_API_KEY')
    if not expected_key:
        raise HTTPException(status_code=500, detail="API authentication not configured")
    
    if credentials.credentials != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return True


# Health and status endpoints
@app.get("/health")
async def health_check():
    """System health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system": "trading-system"
    }


@app.get("/status", response_model=SystemStatusResponse)
async def system_status(authenticated: bool = Depends(verify_api_key)):
    """Get comprehensive system status."""
    broker_connected = False
    try:
        broker_connected = await trading_system["broker"].is_connected()
    except:
        pass
    
    return SystemStatusResponse(
        status="operational",
        timestamp=datetime.utcnow().isoformat(),
        components={
            "broker_connected": broker_connected,
            "strategy_engine_running": trading_system["strategy_engine"].is_running,
            "risk_engine_active": trading_system["risk_engine"].is_active,
            "execution_engine_status": trading_system["execution_engine"].status.value,
            "total_events": len(trading_system["event_log"])
        }
    )


# Strategy management endpoints
@app.get("/strategies", response_model=StrategyListResponse)
async def list_strategies(authenticated: bool = Depends(verify_api_key)):
    """List registered trading strategies."""
    strategies = trading_system["strategy_engine"].list_strategies()
    active_count = sum(
        1 for name in strategies 
        if trading_system["strategy_engine"].get_strategy(name).is_active
    )
    
    return StrategyListResponse(
        strategies=strategies,
        active_count=active_count
    )


@app.post("/strategies/{strategy_name}/activate")
async def activate_strategy(
    strategy_name: str,
    authenticated: bool = Depends(verify_api_key)
):
    """Activate a trading strategy."""
    strategy = trading_system["strategy_engine"].get_strategy(strategy_name)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy.activate()
    return {"status": "activated", "strategy": strategy_name}


@app.post("/strategies/{strategy_name}/deactivate")
async def deactivate_strategy(
    strategy_name: str,
    authenticated: bool = Depends(verify_api_key)
):
    """Deactivate a trading strategy."""
    strategy = trading_system["strategy_engine"].get_strategy(strategy_name)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy.deactivate()
    return {"status": "deactivated", "strategy": strategy_name}


# Risk management endpoints
@app.get("/risk/status", response_model=RiskStatusResponse)
async def risk_status(authenticated: bool = Depends(verify_api_key)):
    """Get risk engine status."""
    risk_engine = trading_system["risk_engine"]
    return RiskStatusResponse(
        is_active=risk_engine.is_active,
        rules=risk_engine.list_rules(),
        statistics=risk_engine.get_statistics()
    )


@app.post("/risk/activate")
async def activate_risk_engine(authenticated: bool = Depends(verify_api_key)):
    """Activate risk engine."""
    trading_system["risk_engine"].activate()
    return {"status": "activated", "message": "Risk engine is now active"}


@app.post("/risk/deactivate")
async def deactivate_risk_engine(authenticated: bool = Depends(verify_api_key)):
    """DANGEROUS: Deactivate risk engine."""
    trading_system["risk_engine"].deactivate()
    return {
        "status": "deactivated", 
        "warning": "Risk engine deactivated - all signals will be auto-approved!"
    }


# Execution engine endpoints
@app.get("/execution/status", response_model=ExecutionStatusResponse)
async def execution_status(authenticated: bool = Depends(verify_api_key)):
    """Get execution engine status."""
    execution_engine = trading_system["execution_engine"]
    stats = execution_engine.get_statistics()
    
    return ExecutionStatusResponse(
        status=execution_engine.status.value,
        active_orders=len(execution_engine.get_active_orders()),
        statistics=stats
    )


@app.get("/execution/orders")
async def get_active_orders(authenticated: bool = Depends(verify_api_key)):
    """Get currently active orders."""
    return trading_system["execution_engine"].get_active_orders()


@app.get("/execution/history")
async def get_order_history(
    limit: Optional[int] = 50,
    authenticated: bool = Depends(verify_api_key)
):
    """Get order execution history."""
    history = trading_system["execution_engine"].get_order_history(limit)
    return [
        {
            "order_id": order.order_id,
            "signal_id": order.signal_id,
            "status": order.status.value,
            "timestamp": order.timestamp.isoformat(),
            "broker_order_id": order.broker_order_id,
            "filled_qty": order.filled_qty,
            "filled_price": str(order.filled_price) if order.filled_price else None
        }
        for order in history
    ]


# Portfolio and account endpoints
@app.get("/account")
async def get_account(authenticated: bool = Depends(verify_api_key)):
    """Get current account information."""
    try:
        account = await trading_system["broker"].get_account()
        return {
            "equity": str(account.equity),
            "buying_power": str(account.buying_power),
            "cash": str(account.cash),
            "day_trades_remaining": account.day_trades_remaining,
            "timestamp": account.timestamp.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get account: {e}")


@app.get("/positions")
async def get_positions(authenticated: bool = Depends(verify_api_key)):
    """Get current portfolio positions."""
    try:
        positions = await trading_system["broker"].get_positions()
        return [
            {
                "symbol": pos.symbol,
                "qty": pos.qty,
                "avg_price": str(pos.avg_price),
                "unrealized_pl": str(pos.unrealized_pl),
                "exposure_pct": pos.exposure_pct,
                "timestamp": pos.timestamp.isoformat()
            }
            for pos in positions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get positions: {e}")


# AI Advisory endpoints (Phase 2)
@app.post("/ai/analyze", response_model=AIAnalysisResponse)
async def ai_analysis(
    request: AIAnalysisRequest,
    authenticated: bool = Depends(verify_api_key)
):
    """Get AI analysis and suggestions (advisory only)."""
    try:
        ai_advisor = trading_system["ai_advisor"]
        
        # Get current account and positions for context
        account = await trading_system["broker"].get_account()
        positions = await trading_system["broker"].get_positions()
        
        result = {}
        
        if request.analysis_type == "portfolio_risk":
            result = await ai_advisor.analyze_portfolio_risk(
                account, positions, request.context or {}
            )
            
        elif request.analysis_type == "trade_ideas":
            ideas = await ai_advisor.generate_trade_ideas(
                account, positions, request.context or {}
            )
            result = {
                "ideas": [
                    {
                        "id": idea.id,
                        "description": idea.description,
                        "rationale": idea.rationale,
                        "risk_notes": idea.risk_notes,
                        "confidence": idea.confidence,
                        "created_at": idea.created_at.isoformat()
                    }
                    for idea in ideas
                ]
            }
            
        elif request.analysis_type == "question" and request.question:
            answer = await ai_advisor.answer_trading_question(
                request.question, request.context
            )
            result = {"answer": answer}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid analysis type")
        
        return AIAnalysisResponse(
            analysis_type=request.analysis_type,
            result=result,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {e}")


@app.post("/ai/ideas/{idea_id}/action")
async def handle_trade_idea_action(
    idea_id: str,
    request: TradeIdeaActionRequest,
    authenticated: bool = Depends(verify_api_key)
):
    """Handle user action on AI trade idea (approve/reject)."""
    try:
        ai_advisor = trading_system["ai_advisor"]
        
        if request.action == "approve":
            result = await ai_advisor.approve_trade_idea(idea_id, request.notes)
        elif request.action == "reject":
            result = await ai_advisor.reject_trade_idea(idea_id, request.notes or "User rejected")
        else:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
        return {
            "status": "success",
            "action": request.action,
            "idea_id": idea_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process idea action: {e}")


# Event and audit endpoints
@app.get("/events")
async def get_recent_events(
    limit: Optional[int] = 100,
    event_type: Optional[str] = None,
    authenticated: bool = Depends(verify_api_key)
):
    """Get recent system events for audit trail."""
    events = trading_system["event_log"]
    
    # Filter by event type if specified
    if event_type:
        events = [e for e in events if e.event_type.value == event_type]
    
    # Apply limit
    events = events[-limit:] if limit else events
    
    return [
        {
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "metadata": event.metadata
        }
        for event in reversed(events)  # Most recent first
    ]


# Market data simulation endpoint (for testing)
@app.post("/market/simulate")
async def simulate_market_event(
    symbol: str,
    price: float,
    authenticated: bool = Depends(verify_api_key)
):
    """Simulate market event for testing strategies."""
    market_event = MarketEvent(
        type=MarketEventType.TICK,
        symbol=symbol.upper(),
        timestamp=datetime.utcnow(),
        payload={"price": price, "volume": 1000}
    )
    
    await trading_system["strategy_engine"].process_market_event(market_event)
    
    return {
        "status": "simulated",
        "symbol": symbol.upper(),
        "price": price,
        "timestamp": market_event.timestamp.isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    # Check required environment variables
    required_vars = ['ALPACA_API_KEY', 'ALPACA_SECRET_KEY', 'TRADING_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Missing required environment variables: {missing_vars}")
        exit(1)
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )