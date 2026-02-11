"""
Core domain models for the trading system.

These models define the essential data structures and business rules.
All models are immutable and contain no business logic beyond validation.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Dict, Any, List
import uuid


class Side(Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class SignalSource(Enum):
    STRATEGY = "strategy"
    AI = "ai"


class OrderStatus(Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class MarketEventType(Enum):
    TICK = "tick"
    BAR = "bar"
    VOLATILITY = "volatility"
    OPTION_CHAIN = "option_chain"


@dataclass(frozen=True)
class TradeSignal:
    """
    Immutable trade signal from strategy or AI.
    
    Must pass through RiskEngine before execution.
    """
    id: str
    symbol: str
    side: Side
    qty: int
    order_type: OrderType
    confidence: float  # 0.0 to 1.0
    source: SignalSource
    created_at: datetime
    strategy_name: Optional[str] = None
    price: Optional[Decimal] = None
    stop_price: Optional[Decimal] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate signal constraints."""
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("Confidence must be between 0.0 and 1.0")
        if self.qty <= 0:
            raise ValueError("Quantity must be positive")
        if self.price is not None and self.price <= 0:
            raise ValueError("Price must be positive")


@dataclass(frozen=True)
class TradeIdea:
    """
    AI-generated trade suggestion requiring human approval.
    
    Does not execute automatically - purely advisory.
    """
    id: str
    description: str
    rationale: str
    risk_notes: str
    confidence: float  # 0.0 to 1.0
    created_at: datetime
    suggested_signal: Optional[TradeSignal] = None
    market_context: Dict[str, Any] = field(default_factory=dict)
    approved: Optional[bool] = None
    approved_at: Optional[datetime] = None
    user_notes: Optional[str] = None


@dataclass(frozen=True)
class PositionSnapshot:
    """Current position state for a symbol."""
    symbol: str
    qty: int  # Can be negative for short positions
    avg_price: Decimal
    unrealized_pl: Decimal
    exposure_pct: float  # Percentage of total portfolio value
    timestamp: datetime


@dataclass(frozen=True)
class AccountSnapshot:
    """Current account state."""
    equity: Decimal
    buying_power: Decimal
    cash: Decimal
    day_trades_remaining: int
    timestamp: datetime


@dataclass(frozen=True)
class MarketEvent:
    """Market data event."""
    type: MarketEventType
    symbol: str
    timestamp: datetime
    payload: Dict[str, Any]


@dataclass(frozen=True)
class ApprovedTrade:
    """Trade signal approved by RiskEngine."""
    signal: TradeSignal
    approved_at: datetime
    risk_check_metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class RejectedTrade:
    """Trade signal rejected by RiskEngine."""
    signal: TradeSignal
    rejected_at: datetime
    rejection_reason: str
    risk_check_metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class OrderEvent:
    """Order lifecycle event."""
    order_id: str
    signal_id: str
    status: OrderStatus
    timestamp: datetime
    broker_order_id: Optional[str] = None
    filled_qty: int = 0
    filled_price: Optional[Decimal] = None
    rejection_reason: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class VolatilitySnapshot:
    """Current volatility metrics."""
    symbol: str
    implied_vol: float
    historical_vol: float
    vol_rank: float  # 0-100 percentile
    vix_level: float
    timestamp: datetime


@dataclass(frozen=True)
class OptionChainSummary:
    """Summary of options activity for a symbol."""
    symbol: str
    expiration_date: str
    put_call_ratio: float
    max_pain: Decimal
    total_volume: int
    total_open_interest: int
    timestamp: datetime


# Factory functions for creating domain objects
def create_trade_signal(
    symbol: str,
    side: Side,
    qty: int,
    source: SignalSource,
    confidence: float,
    strategy_name: Optional[str] = None,
    order_type: OrderType = OrderType.MARKET,
    price: Optional[Decimal] = None,
    stop_price: Optional[Decimal] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> TradeSignal:
    """Create a new trade signal with generated ID."""
    return TradeSignal(
        id=str(uuid.uuid4()),
        symbol=symbol.upper(),
        side=side,
        qty=qty,
        order_type=order_type,
        confidence=confidence,
        source=source,
        created_at=datetime.utcnow(),
        strategy_name=strategy_name,
        price=price,
        stop_price=stop_price,
        metadata=metadata or {}
    )


def create_trade_idea(
    description: str,
    rationale: str,
    risk_notes: str,
    confidence: float,
    suggested_signal: Optional[TradeSignal] = None,
    market_context: Optional[Dict[str, Any]] = None
) -> TradeIdea:
    """Create a new trade idea with generated ID."""
    return TradeIdea(
        id=str(uuid.uuid4()),
        description=description,
        rationale=rationale,
        risk_notes=risk_notes,
        confidence=confidence,
        created_at=datetime.utcnow(),
        suggested_signal=suggested_signal,
        market_context=market_context or {}
    )