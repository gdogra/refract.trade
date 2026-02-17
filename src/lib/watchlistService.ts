export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  added: Date
}

class WatchlistService {
  private watchlist: WatchlistItem[] = []
  private listeners: ((watchlist: WatchlistItem[]) => void)[] = []

  constructor() {
    // Load watchlist from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedWatchlist = localStorage.getItem('userWatchlist')
      if (savedWatchlist) {
        this.watchlist = JSON.parse(savedWatchlist).map((item: any) => ({
          ...item,
          added: new Date(item.added)
        }))
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userWatchlist', JSON.stringify(this.watchlist))
    }
  }

  addToWatchlist(symbol: string, name?: string): boolean {
    if (this.watchlist.some(item => item.symbol === symbol.toUpperCase())) {
      return false // Already in watchlist
    }

    const newItem: WatchlistItem = {
      symbol: symbol.toUpperCase(),
      name: name || `${symbol.toUpperCase()} Company`,
      price: 0, // Will be updated with real data when API is connected
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      pe: 0,
      added: new Date()
    }

    this.watchlist.push(newItem)
    this.saveToLocalStorage()
    this.notifyListeners()
    return true
  }

  removeFromWatchlist(symbol: string): boolean {
    const initialLength = this.watchlist.length
    this.watchlist = this.watchlist.filter(item => item.symbol !== symbol.toUpperCase())
    
    if (this.watchlist.length < initialLength) {
      this.saveToLocalStorage()
      this.notifyListeners()
      return true
    }
    return false
  }

  getWatchlist(): WatchlistItem[] {
    return [...this.watchlist].sort((a, b) => b.added.getTime() - a.added.getTime())
  }

  isInWatchlist(symbol: string): boolean {
    return this.watchlist.some(item => item.symbol === symbol.toUpperCase())
  }

  subscribe(listener: (watchlist: WatchlistItem[]) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.getWatchlist())
    })
  }

  // Get symbol data with basic info for common symbols
  getSymbolInfo(symbol: string): { symbol: string; name: string } | null {
    const commonSymbols: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla, Inc.',
      'AMZN': 'Amazon.com, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'SPY': 'SPDR S&P 500 ETF',
      'QQQ': 'Invesco QQQ Trust',
      'PLTR': 'Palantir Technologies Inc.',
      'ORCL': 'Oracle Corporation',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices Inc.',
      'INTC': 'Intel Corporation'
    }

    const upperSymbol = symbol.toUpperCase()
    const name = commonSymbols[upperSymbol]
    
    return name ? { symbol: upperSymbol, name } : { symbol: upperSymbol, name: `${upperSymbol} Company` }
  }
}

// Export singleton instance
export const watchlistService = new WatchlistService()