export interface PriceAlert {
  id: string
  symbol: string
  price: number
  type: 'above' | 'below'
  createdAt: Date
  triggered: boolean
  message?: string
}

class PriceAlertsManager {
  private storageKey = 'refract_price_alerts'

  // Get all price alerts
  getAllAlerts(): PriceAlert[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []
      
      const alerts = JSON.parse(stored)
      return alerts.map((alert: any) => ({
        ...alert,
        createdAt: new Date(alert.createdAt)
      }))
    } catch {
      return []
    }
  }

  // Get alerts for a specific symbol
  getAlertsForSymbol(symbol: string): PriceAlert[] {
    return this.getAllAlerts().filter(alert => 
      alert.symbol.toUpperCase() === symbol.toUpperCase() && !alert.triggered
    )
  }

  // Add a new price alert
  addAlert(symbol: string, price: number, currentPrice: number, message?: string): PriceAlert {
    const alert: PriceAlert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      symbol: symbol.toUpperCase(),
      price,
      type: price > currentPrice ? 'above' : 'below',
      createdAt: new Date(),
      triggered: false,
      message: message || `Alert for ${symbol} at $${price.toFixed(2)}`
    }

    const alerts = this.getAllAlerts()
    alerts.push(alert)
    this.saveAlerts(alerts)
    
    return alert
  }

  // Remove an alert
  removeAlert(alertId: string): void {
    const alerts = this.getAllAlerts().filter(alert => alert.id !== alertId)
    this.saveAlerts(alerts)
  }

  // Check if any alerts should be triggered
  checkAlerts(symbol: string, currentPrice: number): PriceAlert[] {
    const alerts = this.getAllAlerts()
    const triggeredAlerts: PriceAlert[] = []

    const updatedAlerts = alerts.map(alert => {
      if (alert.symbol.toUpperCase() === symbol.toUpperCase() && !alert.triggered) {
        const shouldTrigger = 
          (alert.type === 'above' && currentPrice >= alert.price) ||
          (alert.type === 'below' && currentPrice <= alert.price)

        if (shouldTrigger) {
          triggeredAlerts.push({ ...alert, triggered: true })
          return { ...alert, triggered: true }
        }
      }
      return alert
    })

    if (triggeredAlerts?.length || 0 > 0) {
      this.saveAlerts(updatedAlerts)
    }

    return triggeredAlerts
  }

  // Get triggered alerts
  getTriggeredAlerts(): PriceAlert[] {
    return this.getAllAlerts().filter(alert => alert.triggered)
  }

  // Clear triggered alerts
  clearTriggeredAlerts(): void {
    const alerts = this.getAllAlerts().filter(alert => !alert.triggered)
    this.saveAlerts(alerts)
  }

  private saveAlerts(alerts: PriceAlert[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(alerts))
    } catch (error) {
      console.error('Failed to save price alerts:', error)
    }
  }
}

export const priceAlertsManager = new PriceAlertsManager()