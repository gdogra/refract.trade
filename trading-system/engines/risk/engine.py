"""
Risk Engine - Mandatory Gate for Trade Execution.

All trade signals must pass through risk validation before execution.
Implements position sizing, exposure limits, and risk constraints.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Callable, Optional
from decimal import Decimal

from domain.models import (
    TradeSignal, ApprovedTrade, RejectedTrade, PositionSnapshot, 
    AccountSnapshot, Side
)
from domain.simple_events import DomainEvent, create_signal_approved_event, create_signal_rejected_event


class RiskRule:
    """Base class for risk validation rules."""
    
    def __init__(self, name: str):
        self.name = name
    
    async def validate(
        self, 
        signal: TradeSignal,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        recent_signals: List[TradeSignal]
    ) -> tuple[bool, Optional[str]]:
        """
        Validate trade signal against risk rule.
        
        Returns:
            (is_valid, rejection_reason)
        """
        raise NotImplementedError


class MaxPositionSizeRule(RiskRule):
    """Limit maximum position size as percentage of account equity."""
    
    def __init__(self, max_position_pct: float = 0.05):
        super().__init__("max_position_size")
        self.max_position_pct = max_position_pct
    
    async def validate(
        self, 
        signal: TradeSignal,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        recent_signals: List[TradeSignal]
    ) -> tuple[bool, Optional[str]]:
        """Validate position size doesn't exceed limit."""
        
        # Estimate position value (simplified - assume $100/share)
        estimated_price = 100  # In real system, get current market price
        position_value = Decimal(signal.qty) * Decimal(estimated_price)
        position_pct = float(position_value / account.equity)
        
        if position_pct > self.max_position_pct:
            return False, (
                f"Position size {position_pct:.1%} exceeds maximum "
                f"{self.max_position_pct:.1%} of account equity"
            )
        
        return True, None


class MaxPositionsPerSymbolRule(RiskRule):
    """Limit number of open positions per symbol."""
    
    def __init__(self, max_positions: int = 2):
        super().__init__("max_positions_per_symbol")
        self.max_positions = max_positions
    
    async def validate(
        self, 
        signal: TradeSignal,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        recent_signals: List[TradeSignal]
    ) -> tuple[bool, Optional[str]]:
        """Validate symbol doesn't have too many positions."""
        
        # Count existing positions for this symbol
        symbol_positions = [p for p in positions if p.symbol == signal.symbol and p.qty != 0]
        
        if len(symbol_positions) >= self.max_positions:
            return False, (
                f"Symbol {signal.symbol} already has {len(symbol_positions)} "
                f"positions (max: {self.max_positions})"
            )
        
        return True, None


class MinConfidenceRule(RiskRule):
    """Require minimum confidence score for signals."""
    
    def __init__(self, min_confidence: float = 0.6):
        super().__init__("min_confidence")
        self.min_confidence = min_confidence
    
    async def validate(
        self, 
        signal: TradeSignal,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        recent_signals: List[TradeSignal]
    ) -> tuple[bool, Optional[str]]:
        """Validate signal confidence meets minimum."""
        
        if signal.confidence < self.min_confidence:
            return False, (
                f"Signal confidence {signal.confidence:.2f} below minimum "
                f"{self.min_confidence:.2f}"
            )
        
        return True, None


class DuplicateSignalRule(RiskRule):
    """Prevent duplicate signals within time window."""
    
    def __init__(self, time_window_minutes: int = 1):
        super().__init__("duplicate_signal")
        self.time_window = timedelta(minutes=time_window_minutes)
    
    async def validate(
        self, 
        signal: TradeSignal,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        recent_signals: List[TradeSignal]
    ) -> tuple[bool, Optional[str]]:
        """Validate no duplicate signals in time window."""
        
        cutoff_time = signal.created_at - self.time_window
        
        for recent_signal in recent_signals:
            if (recent_signal.symbol == signal.symbol and 
                recent_signal.side == signal.side and 
                recent_signal.created_at > cutoff_time):
                
                return False, (
                    f"Duplicate signal for {signal.symbol} {signal.side.value} "
                    f"within {self.time_window.total_seconds()/60:.0f} minutes"
                )
        
        return True, None


class MarketHoursRule(RiskRule):
    """Ensure market is open for trading."""
    
    def __init__(self):
        super().__init__("market_hours")
    
    async def validate(
        self, 
        signal: TradeSignal,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        recent_signals: List[TradeSignal]
    ) -> tuple[bool, Optional[str]]:
        """Validate market is open."""
        
        # Simplified check - in real system, check actual market hours
        current_time = datetime.now()
        is_weekend = current_time.weekday() >= 5
        
        if is_weekend:
            return False, "Market is closed (weekend)"
        
        # Check market hours (9:30 AM - 4:00 PM ET, simplified)
        hour = current_time.hour
        if hour < 9 or hour >= 16:
            return False, "Market is closed (outside trading hours)"
        
        return True, None


class RiskEngine:
    """
    Risk Engine - Mandatory validation gate for all trade signals.
    
    Validates signals against configurable risk rules before allowing execution.
    All signals must pass ALL rules to be approved.
    """
    
    def __init__(self, event_publisher: Callable[[DomainEvent], None]):
        self.rules: List[RiskRule] = []
        self.event_publisher = event_publisher
        self.logger = logging.getLogger(__name__)
        self.is_active = True
        
        # Track recent signals for duplicate detection
        self.recent_signals: List[TradeSignal] = []
        self.max_recent_signals = 1000
        
        # Initialize default rules
        self._setup_default_rules()
    
    def _setup_default_rules(self):
        """Setup default risk rules."""
        self.add_rule(MaxPositionSizeRule(max_position_pct=0.05))  # 5% max position
        self.add_rule(MaxPositionsPerSymbolRule(max_positions=2))  # 2 positions per symbol
        self.add_rule(MinConfidenceRule(min_confidence=0.6))       # 60% min confidence
        self.add_rule(DuplicateSignalRule(time_window_minutes=1))  # 1 minute duplicate window
        self.add_rule(MarketHoursRule())                          # Market hours check
    
    def add_rule(self, rule: RiskRule):
        """Add a risk validation rule."""
        self.rules.append(rule)
        self.logger.info(f"Added risk rule: {rule.name}")
    
    def remove_rule(self, rule_name: str):
        """Remove a risk validation rule."""
        self.rules = [rule for rule in self.rules if rule.name != rule_name]
        self.logger.info(f"Removed risk rule: {rule_name}")
    
    def list_rules(self) -> List[str]:
        """List all active risk rules."""
        return [rule.name for rule in self.rules]
    
    async def validate_signal(
        self,
        signal: TradeSignal,
        account: AccountSnapshot,
        positions: List[PositionSnapshot]
    ) -> tuple[ApprovedTrade, None] | tuple[None, RejectedTrade]:
        """
        Validate trade signal against all risk rules.
        
        Returns:
            Either (ApprovedTrade, None) or (None, RejectedTrade)
        """
        if not self.is_active:
            rejected_trade = RejectedTrade(
                signal=signal,
                rejected_at=datetime.utcnow(),
                rejection_reason="Risk engine is disabled",
                risk_check_metadata={"engine_disabled": True}
            )
            return None, rejected_trade
        
        self.logger.info(
            f"Validating signal: {signal.symbol} {signal.side.value} "
            f"{signal.qty} (confidence: {signal.confidence:.2f})"
        )
        
        # Run all risk rules
        risk_metadata = {}
        
        for rule in self.rules:
            try:
                is_valid, rejection_reason = await rule.validate(
                    signal, account, positions, self.recent_signals
                )
                
                risk_metadata[f"rule_{rule.name}"] = {
                    "passed": is_valid,
                    "reason": rejection_reason
                }
                
                if not is_valid:
                    self.logger.warning(
                        f"Signal rejected by rule {rule.name}: {rejection_reason}"
                    )
                    
                    rejected_trade = RejectedTrade(
                        signal=signal,
                        rejected_at=datetime.utcnow(),
                        rejection_reason=f"{rule.name}: {rejection_reason}",
                        risk_check_metadata=risk_metadata
                    )
                    
                    # Publish rejection event
                    rejection_event = create_signal_rejected_event(rejected_trade)
                    self.event_publisher(rejection_event)
                    
                    return None, rejected_trade
                    
            except Exception as e:
                self.logger.error(f"Error in risk rule {rule.name}: {e}")
                
                rejected_trade = RejectedTrade(
                    signal=signal,
                    rejected_at=datetime.utcnow(),
                    rejection_reason=f"Risk validation error: {e}",
                    risk_check_metadata={"error": str(e)}
                )
                
                return None, rejected_trade
        
        # All rules passed - approve the trade
        approved_trade = ApprovedTrade(
            signal=signal,
            approved_at=datetime.utcnow(),
            risk_check_metadata=risk_metadata
        )
        
        # Track signal for duplicate detection
        self._add_recent_signal(signal)
        
        # Publish approval event
        approval_event = create_signal_approved_event(approved_trade)
        self.event_publisher(approval_event)
        
        self.logger.info(f"Signal approved: {signal.symbol} {signal.side.value} {signal.qty}")
        
        return approved_trade, None
    
    def _add_recent_signal(self, signal: TradeSignal):
        """Add signal to recent signals tracking."""
        self.recent_signals.append(signal)
        
        # Keep only recent signals
        if len(self.recent_signals) > self.max_recent_signals:
            self.recent_signals = self.recent_signals[-self.max_recent_signals//2:]
    
    async def handle_signal_generated_event(
        self, 
        event: DomainEvent,
        account: AccountSnapshot,
        positions: List[PositionSnapshot]
    ) -> None:
        """Handle signal generated events."""
        if 'signal' in event.metadata:
            await self.validate_signal(event.metadata['signal'], account, positions)
    
    def activate(self):
        """Activate the risk engine."""
        self.is_active = True
        self.logger.info("Risk engine activated")
    
    def deactivate(self):
        """Deactivate the risk engine (DANGEROUS - allows all signals)."""
        self.is_active = False
        self.logger.warning("Risk engine deactivated - ALL SIGNALS WILL BE APPROVED!")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get risk engine statistics."""
        return {
            "is_active": self.is_active,
            "active_rules": len(self.rules),
            "recent_signals_tracked": len(self.recent_signals),
            "rules": [rule.name for rule in self.rules]
        }