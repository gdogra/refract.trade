"""
Domain events for the trading system.

Events represent things that have happened and trigger reactions
across different parts of the system. All events are immutable.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum

from .models import TradeSignal, TradeIdea, ApprovedTrade, RejectedTrade, OrderEvent, PositionSnapshot


class EventType(Enum):
    # Market events
    MARKET_DATA_RECEIVED = "market_data_received"
    MARKET_OPENED = "market_opened"
    MARKET_CLOSED = "market_closed"
    
    # Signal events
    SIGNAL_GENERATED = "signal_generated"
    SIGNAL_APPROVED = "signal_approved"
    SIGNAL_REJECTED = "signal_rejected"
    
    # Order events
    ORDER_SUBMITTED = "order_submitted"
    ORDER_FILLED = "order_filled"
    ORDER_CANCELLED = "order_cancelled"
    ORDER_REJECTED = "order_rejected"
    
    # AI events
    TRADE_IDEA_GENERATED = "trade_idea_generated"
    TRADE_IDEA_APPROVED = "trade_idea_approved"
    TRADE_IDEA_REJECTED = "trade_idea_rejected"
    
    # System events
    BROKER_CONNECTED = "broker_connected"
    BROKER_DISCONNECTED = "broker_disconnected"
    STRATEGY_ACTIVATED = "strategy_activated"
    STRATEGY_DEACTIVATED = "strategy_deactivated"
    
    # Risk events
    RISK_LIMIT_BREACHED = "risk_limit_breached"
    POSITION_LIMIT_EXCEEDED = "position_limit_exceeded"


@dataclass(frozen=True)
class DomainEvent:
    """Base class for all domain events."""
    event_type: EventType
    event_id: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class MarketDataReceived(DomainEvent):
    """Market data has been received and processed."""
    symbol: str
    data_type: str  # "tick", "bar", "volatility", etc.
    payload: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SignalGenerated(DomainEvent):
    """A trading strategy has generated a signal."""
    signal: TradeSignal
    strategy_name: str


@dataclass(frozen=True)
class SignalApproved(DomainEvent):
    """Risk engine has approved a signal for execution."""
    approved_trade: ApprovedTrade


@dataclass(frozen=True)
class SignalRejected(DomainEvent):
    """Risk engine has rejected a signal."""
    rejected_trade: RejectedTrade


@dataclass(frozen=True)
class OrderSubmitted(DomainEvent):
    """An order has been submitted to the broker."""
    order_event: OrderEvent
    signal_id: str


@dataclass(frozen=True)
class OrderFilled(DomainEvent):
    """An order has been filled by the broker."""
    order_event: OrderEvent
    position_snapshot: PositionSnapshot


@dataclass(frozen=True)
class OrderRejected(DomainEvent):
    """An order has been rejected by the broker."""
    order_event: OrderEvent
    rejection_reason: str


@dataclass(frozen=True)
class TradeIdeaGenerated(DomainEvent):
    """AI has generated a trade idea requiring approval."""
    trade_idea: TradeIdea


@dataclass(frozen=True)
class TradeIdeaApproved(DomainEvent):
    """User has approved an AI trade idea."""
    trade_idea: TradeIdea
    approved_signal: Optional[TradeSignal] = None


@dataclass(frozen=True)
class TradeIdeaRejected(DomainEvent):
    """User has rejected an AI trade idea."""
    trade_idea: TradeIdea
    rejection_reason: str


@dataclass(frozen=True)
class BrokerConnected(DomainEvent):
    """Broker connection established."""
    broker_name: str
    connection_info: Dict[str, Any]


@dataclass(frozen=True)
class BrokerDisconnected(DomainEvent):
    """Broker connection lost."""
    broker_name: str
    disconnection_reason: str


@dataclass(frozen=True)
class StrategyActivated(DomainEvent):
    """A trading strategy has been activated."""
    strategy_name: str
    symbols: list


@dataclass(frozen=True)
class StrategyDeactivated(DomainEvent):
    """A trading strategy has been deactivated."""
    strategy_name: str
    reason: str


@dataclass(frozen=True)
class RiskLimitBreached(DomainEvent):
    """A risk limit has been exceeded."""
    limit_type: str
    current_value: float
    limit_value: float
    signal_id: Optional[str] = None


# Event factory functions
def create_signal_generated_event(signal: TradeSignal, strategy_name: str) -> SignalGenerated:
    """Create a signal generated event."""
    import uuid
    return SignalGenerated(
        event_type=EventType.SIGNAL_GENERATED,
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        signal=signal,
        strategy_name=strategy_name
    )


def create_signal_approved_event(approved_trade: ApprovedTrade) -> SignalApproved:
    """Create a signal approved event."""
    import uuid
    return SignalApproved(
        event_type=EventType.SIGNAL_APPROVED,
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        approved_trade=approved_trade
    )


def create_signal_rejected_event(rejected_trade: RejectedTrade) -> SignalRejected:
    """Create a signal rejected event."""
    import uuid
    return SignalRejected(
        event_type=EventType.SIGNAL_REJECTED,
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        rejected_trade=rejected_trade
    )


def create_trade_idea_generated_event(trade_idea: TradeIdea) -> TradeIdeaGenerated:
    """Create a trade idea generated event."""
    import uuid
    return TradeIdeaGenerated(
        event_type=EventType.TRADE_IDEA_GENERATED,
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        trade_idea=trade_idea
    )