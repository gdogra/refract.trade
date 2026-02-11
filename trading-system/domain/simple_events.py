"""
Simplified domain events for testing.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum

from .models import TradeSignal, TradeIdea, ApprovedTrade, RejectedTrade, OrderEvent, PositionSnapshot


class EventType(Enum):
    SIGNAL_GENERATED = "signal_generated"
    SIGNAL_APPROVED = "signal_approved"
    SIGNAL_REJECTED = "signal_rejected"
    ORDER_SUBMITTED = "order_submitted"
    ORDER_FILLED = "order_filled"
    ORDER_REJECTED = "order_rejected"


@dataclass(frozen=True)
class DomainEvent:
    """Base class for all domain events."""
    event_type: EventType
    event_id: str
    timestamp: datetime
    metadata: Dict[str, Any]


def create_signal_generated_event(signal: TradeSignal, strategy_name: str) -> DomainEvent:
    """Create a signal generated event."""
    import uuid
    return DomainEvent(
        event_type=EventType.SIGNAL_GENERATED,
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        metadata={
            'signal': signal,
            'strategy_name': strategy_name
        }
    )


def create_signal_approved_event(approved_trade: ApprovedTrade) -> DomainEvent:
    """Create a signal approved event."""
    import uuid
    return DomainEvent(
        event_type=EventType.SIGNAL_APPROVED,
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        metadata={
            'approved_trade': approved_trade
        }
    )


def create_signal_rejected_event(rejected_trade: RejectedTrade) -> DomainEvent:
    """Create a signal rejected event."""
    import uuid
    return DomainEvent(
        event_type=EventType.SIGNAL_REJECTED,
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        metadata={
            'rejected_trade': rejected_trade
        }
    )


def create_trade_idea_generated_event(trade_idea: TradeIdea) -> DomainEvent:
    """Create a trade idea generated event."""
    import uuid
    return DomainEvent(
        event_type=EventType.SIGNAL_GENERATED,  # Reuse for simplicity
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        metadata={
            'trade_idea': trade_idea
        }
    )