"""
Execution Engine - Sole Interface to Broker.

Only the ExecutionEngine may call broker APIs.
Converts approved trades into broker orders and manages order lifecycle.
"""

import logging
import asyncio
from typing import Dict, Any, Callable, Optional
from datetime import datetime
from enum import Enum

from adapters.brokers.base import BrokerAdapter, BrokerError
from domain.models import ApprovedTrade, OrderEvent, OrderStatus
from domain.simple_events import DomainEvent


class ExecutionStatus(Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    ERROR = "error"


class ExecutionEngine:
    """
    Execution Engine - The ONLY component allowed to interact with brokers.
    
    Responsibilities:
    - Accept ApprovedTrade objects from RiskEngine
    - Convert to broker orders via BrokerAdapter
    - Monitor order status and publish events
    - Handle order lifecycle (submit, fill, cancel, reject)
    
    STRICT RULES:
    - Only processes ApprovedTrade objects (from RiskEngine)
    - Only interface allowed to call BrokerAdapter methods
    - All broker interactions must be logged and audited
    """
    
    def __init__(
        self, 
        broker: BrokerAdapter, 
        event_publisher: Callable[[DomainEvent], None]
    ):
        self.broker = broker
        self.event_publisher = event_publisher
        self.logger = logging.getLogger(__name__)
        self.status = ExecutionStatus.IDLE
        
        # Track active orders
        self.active_orders: Dict[str, Dict[str, Any]] = {}
        self.order_history: Dict[str, OrderEvent] = {}
        
        # Execution statistics
        self.stats = {
            "orders_submitted": 0,
            "orders_filled": 0,
            "orders_rejected": 0,
            "orders_cancelled": 0,
            "total_execution_time": 0.0
        }
    
    async def initialize(self) -> bool:
        """Initialize execution engine and broker connection."""
        try:
            self.logger.info("Initializing execution engine...")
            
            # Connect to broker
            connected = await self.broker.connect()
            if not connected:
                raise BrokerError("Failed to connect to broker")
            
            self.logger.info("Execution engine initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize execution engine: {e}")
            self.status = ExecutionStatus.ERROR
            return False
    
    async def shutdown(self):
        """Shutdown execution engine and close broker connections."""
        try:
            self.logger.info("Shutting down execution engine...")
            
            # Cancel any remaining active orders
            for order_id in list(self.active_orders.keys()):
                try:
                    await self.cancel_order(order_id)
                except Exception as e:
                    self.logger.error(f"Error cancelling order {order_id}: {e}")
            
            # Disconnect from broker
            await self.broker.disconnect()
            
            self.status = ExecutionStatus.IDLE
            self.logger.info("Execution engine shutdown complete")
            
        except Exception as e:
            self.logger.error(f"Error during execution engine shutdown: {e}")
    
    async def execute_approved_trade(self, approved_trade: ApprovedTrade) -> None:
        """
        Execute an approved trade by placing order with broker.
        
        This is the main entry point for trade execution.
        Only accepts ApprovedTrade objects from RiskEngine.
        """
        if self.status != ExecutionStatus.IDLE:
            self.logger.error("Execution engine not ready to process trades")
            return
        
        self.status = ExecutionStatus.PROCESSING
        signal = approved_trade.signal
        
        try:
            self.logger.info(
                f"Executing approved trade: {signal.symbol} {signal.side.value} "
                f"{signal.qty} (signal_id: {signal.id})"
            )
            
            start_time = datetime.utcnow()
            
            # Place order with broker (ONLY PLACE WHERE BROKER IS CALLED)
            order_event = await self.broker.place_order(signal)
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            self.stats["total_execution_time"] += execution_time
            
            # Track order
            if order_event.status == OrderStatus.SUBMITTED:
                self._track_order(order_event, approved_trade)
                self.stats["orders_submitted"] += 1
                
                # Log order submitted
                self.logger.info(f"Order submitted: {order_event.broker_order_id}")
                
                self.logger.info(
                    f"Order submitted successfully: {order_event.broker_order_id} "
                    f"(execution time: {execution_time:.3f}s)"
                )
                
                # Start monitoring order status
                asyncio.create_task(self._monitor_order(order_event))
                
            else:
                # Order was rejected
                self.stats["orders_rejected"] += 1
                
                # Log order rejection
                self.logger.warning(f"Order rejected: {order_event.rejection_reason}")
                
                self.logger.warning(
                    f"Order rejected by broker: {order_event.rejection_reason}"
                )
            
            # Store in order history
            self.order_history[order_event.order_id] = order_event
            
        except Exception as e:
            self.logger.error(f"Error executing trade: {e}")
            self.stats["orders_rejected"] += 1
            
            # Create rejection event for internal errors
            error_order = OrderEvent(
                order_id=f"error_{signal.id}",
                signal_id=signal.id,
                status=OrderStatus.REJECTED,
                timestamp=datetime.utcnow(),
                rejection_reason=f"Execution error: {str(e)}"
            )
            
            # Log execution error
            self.logger.error(f"Execution error: {str(e)}")
            
        finally:
            self.status = ExecutionStatus.IDLE
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an active order."""
        if order_id not in self.active_orders:
            self.logger.warning(f"Cannot cancel order {order_id}: not found in active orders")
            return False
        
        try:
            order_info = self.active_orders[order_id]
            broker_order_id = order_info["broker_order_id"]
            
            # Cancel with broker
            cancel_event = await self.broker.cancel_order(broker_order_id)
            
            if cancel_event.status == OrderStatus.CANCELLED:
                self._untrack_order(order_id)
                self.stats["orders_cancelled"] += 1
                
                self.logger.info(f"Order cancelled successfully: {broker_order_id}")
                return True
            else:
                self.logger.warning(f"Failed to cancel order: {broker_order_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error cancelling order {order_id}: {e}")
            return False
    
    async def _monitor_order(self, initial_order_event: OrderEvent):
        """Monitor order status until filled or cancelled."""
        broker_order_id = initial_order_event.broker_order_id
        if not broker_order_id:
            return
        
        max_checks = 300  # 5 minutes at 1-second intervals
        check_count = 0
        
        while check_count < max_checks:
            try:
                await asyncio.sleep(1)  # Check every second
                check_count += 1
                
                # Get current order status from broker
                current_status = await self.broker.get_order_status(broker_order_id)
                
                # Check if order status changed
                if current_status.status in [OrderStatus.FILLED, OrderStatus.PARTIALLY_FILLED]:
                    self._handle_order_fill(current_status)
                    break
                    
                elif current_status.status in [OrderStatus.CANCELLED, OrderStatus.REJECTED]:
                    self._handle_order_cancellation(current_status)
                    break
                
            except Exception as e:
                self.logger.error(f"Error monitoring order {broker_order_id}: {e}")
                break
        
        if check_count >= max_checks:
            self.logger.warning(f"Stopped monitoring order {broker_order_id} after {max_checks} checks")
    
    def _handle_order_fill(self, order_event: OrderEvent):
        """Handle order fill notification."""
        self.stats["orders_filled"] += 1
        
        # Remove from active orders if fully filled
        if order_event.status == OrderStatus.FILLED:
            order_id = None
            for oid, info in self.active_orders.items():
                if info["broker_order_id"] == order_event.broker_order_id:
                    order_id = oid
                    break
            
            if order_id:
                self._untrack_order(order_id)
        
        # Log fill event
        self.logger.info(f"Order filled: {order_event.broker_order_id}")
        
        self.logger.info(
            f"Order filled: {order_event.broker_order_id} "
            f"({order_event.filled_qty} shares at ${order_event.filled_price})"
        )
    
    def _handle_order_cancellation(self, order_event: OrderEvent):
        """Handle order cancellation notification."""
        # Find and remove from active orders
        order_id = None
        for oid, info in self.active_orders.items():
            if info["broker_order_id"] == order_event.broker_order_id:
                order_id = oid
                break
        
        if order_id:
            self._untrack_order(order_id)
        
        if order_event.status == OrderStatus.CANCELLED:
            self.stats["orders_cancelled"] += 1
        else:
            self.stats["orders_rejected"] += 1
        
        self.logger.info(f"Order {order_event.status.value}: {order_event.broker_order_id}")
    
    def _track_order(self, order_event: OrderEvent, approved_trade: ApprovedTrade):
        """Track active order."""
        self.active_orders[order_event.order_id] = {
            "broker_order_id": order_event.broker_order_id,
            "signal_id": approved_trade.signal.id,
            "symbol": approved_trade.signal.symbol,
            "side": approved_trade.signal.side,
            "qty": approved_trade.signal.qty,
            "submitted_at": order_event.timestamp,
            "approved_trade": approved_trade
        }
    
    def _untrack_order(self, order_id: str):
        """Remove order from active tracking."""
        if order_id in self.active_orders:
            del self.active_orders[order_id]
    
    async def handle_signal_approved_event(self, event: DomainEvent) -> None:
        """Handle signal approved events from RiskEngine."""
        if 'approved_trade' in event.metadata:
            await self.execute_approved_trade(event.metadata['approved_trade'])
    
    def get_active_orders(self) -> Dict[str, Any]:
        """Get currently active orders."""
        return dict(self.active_orders)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get execution statistics."""
        stats = dict(self.stats)
        stats.update({
            "status": self.status.value,
            "active_orders_count": len(self.active_orders),
            "broker_connected": True  # Simplified for now
        })
        return stats
    
    def get_order_history(self, limit: Optional[int] = None) -> list[OrderEvent]:
        """Get order execution history."""
        orders = list(self.order_history.values())
        orders.sort(key=lambda x: x.timestamp, reverse=True)
        
        if limit:
            orders = orders[:limit]
        
        return orders