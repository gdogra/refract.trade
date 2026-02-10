import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from models.trade_signal import TradeSignal
from utils.database import DatabaseLogger


class RiskEngine:
    """
    Risk management engine that validates trades against risk parameters.
    
    Rejects trades that violate risk rules:
    - Position size > 5% account equity
    - Duplicate signal within 60 seconds
    - Market closed
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.db_logger = DatabaseLogger()
        self.recent_signals: Dict[str, datetime] = {}
        self.market_hours = {
            'open': '09:30',
            'close': '16:00',
            'timezone': 'US/Eastern'
        }
        
    async def validate_signal(self, signal: TradeSignal, account_equity: float, 
                            current_positions: Dict[str, float]) -> tuple[bool, str]:
        """
        Validate a trade signal against risk parameters.
        
        Args:
            signal: The trade signal to validate
            account_equity: Current account equity
            current_positions: Dict of symbol -> current position value
            
        Returns:
            (is_valid, reason) tuple
        """
        
        # Check position size limit (5% of account equity)
        position_value = signal.qty * 100  # Simplified: assume $100/share
        position_percentage = position_value / account_equity
        
        if position_percentage > 0.05:
            reason = f"Position size ({position_percentage:.1%}) exceeds 5% limit"
            await self.db_logger.log_risk_rejection(signal, reason)
            self.logger.warning(f"Risk rejection: {reason}")
            return False, reason
            
        # Check for duplicate signals within 60 seconds
        signal_key = f"{signal.symbol}_{signal.side.value}"
        if signal_key in self.recent_signals:
            time_diff = signal.timestamp - self.recent_signals[signal_key]
            if time_diff < timedelta(seconds=60):
                reason = f"Duplicate signal within 60s (last: {time_diff.seconds}s ago)"
                await self.db_logger.log_risk_rejection(signal, reason)
                self.logger.warning(f"Risk rejection: {reason}")
                return False, reason
                
        # Check if market is open
        if not self._is_market_open(signal.timestamp):
            reason = "Market is closed"
            await self.db_logger.log_risk_rejection(signal, reason)
            self.logger.warning(f"Risk rejection: {reason}")
            return False, reason
            
        # Check total portfolio exposure
        current_exposure = sum(current_positions.values())
        new_exposure = current_exposure + position_value
        exposure_percentage = new_exposure / account_equity
        
        if exposure_percentage > 0.80:  # Max 80% portfolio exposure
            reason = f"Total exposure ({exposure_percentage:.1%}) would exceed 80% limit"
            await self.db_logger.log_risk_rejection(signal, reason)
            self.logger.warning(f"Risk rejection: {reason}")
            return False, reason
            
        # Additional risk checks based on confidence
        if signal.confidence < 0.3:
            reason = f"Signal confidence ({signal.confidence:.2f}) below minimum threshold (0.30)"
            await self.db_logger.log_risk_rejection(signal, reason)
            self.logger.warning(f"Risk rejection: {reason}")
            return False, reason
            
        # Signal passed all risk checks
        self.recent_signals[signal_key] = signal.timestamp
        await self.db_logger.log_risk_approval(signal)
        self.logger.info(f"Risk approval: {signal.symbol} {signal.side.value} {signal.qty} shares")
        
        return True, "Approved"
        
    def _is_market_open(self, timestamp: datetime) -> bool:
        """
        Check if market is open at given timestamp.
        
        Simplified implementation - in production, use proper market calendar
        with holidays, early closes, etc.
        """
        # Check if it's a weekday (Monday=0, Sunday=6)
        if timestamp.weekday() >= 5:  # Saturday or Sunday
            return False
            
        # Check if it's during market hours (9:30 AM - 4:00 PM ET)
        market_time = timestamp.strftime('%H:%M')
        return '09:30' <= market_time <= '16:00'
        
    async def get_risk_metrics(self, account_equity: float, 
                             current_positions: Dict[str, float]) -> dict:
        """Get current risk metrics for monitoring."""
        total_exposure = sum(current_positions.values())
        exposure_percentage = total_exposure / account_equity if account_equity > 0 else 0
        
        return {
            'account_equity': account_equity,
            'total_exposure': total_exposure,
            'exposure_percentage': exposure_percentage,
            'available_buying_power': account_equity - total_exposure,
            'max_position_size': account_equity * 0.05,
            'positions_count': len(current_positions),
            'recent_signals_count': len(self.recent_signals),
            'market_open': self._is_market_open(datetime.now())
        }
        
    def reset_signal_history(self):
        """Reset recent signals history (useful for testing)."""
        self.recent_signals.clear()
        self.logger.info("Signal history reset")
        
    def update_market_hours(self, open_time: str, close_time: str, timezone: str = 'US/Eastern'):
        """Update market hours configuration."""
        self.market_hours = {
            'open': open_time,
            'close': close_time,
            'timezone': timezone
        }
        self.logger.info(f"Market hours updated: {open_time} - {close_time} {timezone}")