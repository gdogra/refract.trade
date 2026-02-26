export interface Notification {
  id: string
  type: 'order' | 'alert' | 'news' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

class NotificationService {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  constructor() {
    // Initialize with some sample notifications
    this.notifications = [
      {
        id: '1',
        type: 'order',
        title: 'Order Filled',
        message: 'Your AAPL $190 Call order has been filled at $2.45',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        data: { symbol: 'AAPL', orderId: 'ORD_123' }
      },
      {
        id: '2',
        type: 'alert',
        title: 'Price Alert',
        message: 'TSLA has moved above $250.00',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        data: { symbol: 'TSLA', price: 252.30 }
      },
      {
        id: '3',
        type: 'news',
        title: 'Market News',
        message: 'Fed announces interest rate decision - Markets react positively',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true
      },
      {
        id: '4',
        type: 'system',
        title: 'Account Updated',
        message: 'Your account has been upgraded to Pro tier',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true
      }
    ]
  }

  generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const newNotification: Notification = {
      id: this.generateId(),
      timestamp: new Date(),
      read: false,
      ...notification
    }
    
    this.notifications.unshift(newNotification)
    this.notifyListeners()
    return newNotification.id
  }

  getNotifications(): Notification[] {
    return [...this.notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true)
    this.notifyListeners()
  }

  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.notifyListeners()
  }

  clearAll(): void {
    this.notifications = []
    this.notifyListeners()
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.getNotifications())
    })
  }

  // Simulate receiving notifications (for demo purposes)
  simulateOrderFilled(symbol: string, orderId: string, price: number): void {
    this.addNotification({
      type: 'order',
      title: 'Order Filled',
      message: `Your ${symbol} order has been filled at $${(price || 0).toFixed(2)}`,
      data: { symbol, orderId, price }
    })
  }

  simulatePriceAlert(symbol: string, price: number, direction: 'above' | 'below'): void {
    this.addNotification({
      type: 'alert',
      title: 'Price Alert',
      message: `${symbol} has moved ${direction} $${(price || 0).toFixed(2)}`,
      data: { symbol, price, direction }
    })
  }

  simulateNewsUpdate(title: string, message: string): void {
    this.addNotification({
      type: 'news',
      title,
      message
    })
  }
}

export const notificationService = new NotificationService()