export interface Order {
  id: string
  symbol: string
  type: 'call' | 'put'
  action: 'buy' | 'sell'
  strike: number
  expiry: string
  quantity: number
  price: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  timestamp: Date
  totalCost: number
}

export interface OrderRequest {
  symbol: string
  type: 'call' | 'put'
  action: 'buy' | 'sell'
  strike: number
  expiry: string
  quantity: number
  price: number
}

// Import notification service for integration
import { notificationService } from './notificationService'

class OrderService {
  private orders: Order[] = []
  private listeners: ((orders: Order[]) => void)[] = []

  constructor() {
    // Load orders from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem('userOrders')
      if (savedOrders) {
        this.orders = JSON.parse(savedOrders).map((order: any) => ({
          ...order,
          timestamp: new Date(order.timestamp)
        }))
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userOrders', JSON.stringify(this.orders))
    }
  }

  generateOrderId(): string {
    return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async submitOrder(orderRequest: OrderRequest): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // Validate order
      if (orderRequest.quantity <= 0) {
        return { success: false, error: 'Quantity must be greater than 0' }
      }

      if (orderRequest.price <= 0) {
        return { success: false, error: 'Price must be greater than 0' }
      }

      // Calculate total cost (options are per 100 shares)
      const totalCost = orderRequest.price * orderRequest.quantity * 100

      // Create order
      const order: Order = {
        id: this.generateOrderId(),
        ...orderRequest,
        status: 'pending',
        timestamp: new Date(),
        totalCost
      }

      // Add to orders
      this.orders.push(order)
      this.saveToLocalStorage()
      this.notifyListeners()

      // Simulate processing delay
      setTimeout(() => {
        this.processOrder(order.id)
      }, 2000)

      return { success: true, orderId: order.id }
    } catch (error) {
      return { success: false, error: 'Failed to submit order' }
    }
  }

  private processOrder(orderId: string) {
    const order = this.orders.find(o => o.id === orderId)
    if (!order) return

    // Simulate order processing (90% fill rate)
    const willFill = Math.random() > 0.1
    
    order.status = willFill ? 'filled' : 'rejected'
    
    // Add some price slippage for realism
    if (willFill && order.action === 'buy') {
      const slippage = (Math.random() - 0.5) * 0.05 // ±2.5 cents
      order.price = Math.max(0.01, order.price + slippage)
      order.totalCost = order.price * order.quantity * 100
    }

    // Create notification based on order status
    if (willFill) {
      notificationService.addNotification({
        type: 'order',
        title: 'Order Filled',
        message: `Your ${order.symbol} ${order.strike} ${order.type.toUpperCase()} order has been filled at $${order.price.toFixed(2)}`,
        data: { symbol: order.symbol, orderId: order.id }
      })
    } else {
      notificationService.addNotification({
        type: 'order',
        title: 'Order Rejected',
        message: `Your ${order.symbol} ${order.strike} ${order.type.toUpperCase()} order was rejected`,
        data: { symbol: order.symbol, orderId: order.id }
      })
    }

    this.saveToLocalStorage()
    this.notifyListeners()
  }

  getOrders(): Order[] {
    return [...this.orders].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getOrderById(orderId: string): Order | undefined {
    return this.orders.find(o => o.id === orderId)
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.find(o => o.id === orderId)
    if (order && order.status === 'pending') {
      order.status = 'cancelled'
      this.saveToLocalStorage()
      this.notifyListeners()
      return true
    }
    return false
  }

  subscribe(listener: (orders: Order[]) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.getOrders())
    })
  }

  // Get portfolio positions
  getPositions(): Array<{
    symbol: string
    type: 'call' | 'put'
    strike: number
    expiry: string
    quantity: number
    avgPrice: number
    totalCost: number
    currentValue: number
    pnl: number
  }> {
    const filledOrders = this.orders.filter(o => o.status === 'filled')
    const positionMap = new Map<string, any>()

    filledOrders.forEach(order => {
      const key = `${order.symbol}_${order.type}_${order.strike}_${order.expiry}`
      
      if (!positionMap.has(key)) {
        positionMap.set(key, {
          symbol: order.symbol,
          type: order.type,
          strike: order.strike,
          expiry: order.expiry,
          quantity: 0,
          totalCost: 0,
          orders: []
        })
      }

      const position = positionMap.get(key)
      const multiplier = order.action === 'buy' ? 1 : -1
      
      position.quantity += order.quantity * multiplier
      position.totalCost += order.totalCost * multiplier
      position.orders.push(order)
    })

    return Array.from(positionMap.values())
      .filter(pos => pos.quantity !== 0)
      .map(pos => ({
        ...pos,
        avgPrice: Math.abs(pos.totalCost / (pos.quantity * 100)),
        currentValue: pos.quantity * 100 * this.getCurrentPrice(pos.symbol, pos.type, pos.strike),
        pnl: pos.quantity * 100 * this.getCurrentPrice(pos.symbol, pos.type, pos.strike) - pos.totalCost
      }))
  }

  private getCurrentPrice(symbol: string, type: 'call' | 'put', strike: number): number {
    // Mock current prices - in real app would fetch from API
    return Math.random() * 5 + 1
  }
}

// Export singleton instance
export const orderService = new OrderService()