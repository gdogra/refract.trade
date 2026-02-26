/**
 * Unified Data Service
 * Central data layer that coordinates between cache, Polygon API, and fallback providers
 */

import { getPolygonClient, PolygonQuote } from './polygon-client'
import { getCache } from './redis-cache'
import { getStockData } from '@/lib/realMarketData'
import { calculateGreeks, GreeksInput, Greeks } from '@/lib/greeks'

export interface EnrichedQuote extends PolygonQuote {
  sector?: string
  marketCap?: number
  pe?: number
  source: 'polygon' | 'alpha_vantage' | 'fallback'
  cached: boolean
}

export interface EnrichedOptionContract {
  symbol: string
  underlying: string
  strike: number
  expiry: string
  type: 'call' | 'put'
  bid: number
  ask: number
  last: number
  midpoint: number
  volume: number
  openInterest: number
  impliedVolatility: number
  
  // Enriched with calculated Greeks
  greeks: Greeks
  
  // Additional computed fields
  moneyness: number // S/K ratio
  timeValue: number
  intrinsicValue: number
  breakeven: number
  probabilityOTM: number
  
  // Metadata
  source: 'polygon' | 'yahoo' | 'calculated'
  timestamp: number
}

export interface EnrichedOptionsChain {
  underlying: string
  underlyingPrice: number
  calls: EnrichedOptionContract[]
  puts: EnrichedOptionContract[]
  expirations: string[]
  greeksMetadata: {
    riskFreeRate: number
    calculationTime: number
    totalContracts: number
  }
  source: 'polygon' | 'hybrid' | 'fallback'
  timestamp: number
}

class DataService {
  private polygonClient = getPolygonClient()
  private cache = getCache()
  private riskFreeRate = 0.05 // 5% default risk-free rate

  async getQuote(symbol: string, useCache: boolean = true): Promise<EnrichedQuote> {
    const cacheKey = symbol.toUpperCase()

    // Try cache first
    if (useCache) {
      const cached = await this.cache.getQuote(cacheKey)
      if (cached) {
        return { ...cached, cached: true }
      }
    }

    let quote: EnrichedQuote

    try {
      // Try Polygon first
      const polygonQuote = await this.polygonClient.getQuote(symbol)
      quote = {
        ...polygonQuote,
        source: 'polygon' as const,
        cached: false
      }
    } catch (error) {
      console.warn(`Polygon failed for ${symbol}, trying Alpha Vantage:`, error)
      
      try {
        // Fallback to Alpha Vantage
        const alphaData = await getStockData(symbol)
        quote = {
          symbol,
          price: alphaData.price,
          change: alphaData.change,
          changePercent: alphaData.changePercent,
          volume: alphaData.volume,
          high: alphaData.price * 1.02, // Estimate
          low: alphaData.price * 0.98,  // Estimate
          open: alphaData.price - alphaData.change,
          close: alphaData.price,
          timestamp: Date.now(),
          marketCap: alphaData.marketCap,
          sector: alphaData.sector,
          source: 'alpha_vantage' as const,
          cached: false
        }
      } catch (alphaError) {
        console.error(`All providers failed for ${symbol}:`, alphaError)
        throw new Error(`Unable to fetch quote for ${symbol}: All providers failed`)
      }
    }

    // Cache the result
    if (useCache) {
      await this.cache.setQuote(cacheKey, quote, 30) // 30 second TTL
    }

    return quote
  }

  async getOptionsChain(symbol: string, expiration?: string, useCache: boolean = true): Promise<EnrichedOptionsChain> {
    const cacheKey = `${symbol.toUpperCase()}_${expiration || 'nearest'}`

    // Try cache first
    if (useCache) {
      const cached = await this.cache.getOptionsChain(symbol, expiration)
      if (cached) {
        return cached
      }
    }

    // Get underlying price first
    const underlyingQuote = await this.getQuote(symbol, useCache)

    try {
      // Try Polygon (will fail on Starter plan)
      const polygonChain = await this.polygonClient.getOptionsChain(symbol, expiration)
      const enrichedChain = await this.enrichOptionsChain(polygonChain, underlyingQuote.price)
      
      if (useCache) {
        await this.cache.setOptionsChain(symbol, enrichedChain, 60, expiration)
      }
      
      return enrichedChain
    } catch (error) {
      console.warn(`Polygon options failed for ${symbol}, using Yahoo fallback:`, error)
      
      // Fallback to Yahoo Finance + calculated Greeks
      return this.getFallbackOptionsChain(symbol, underlyingQuote.price, expiration, useCache)
    }
  }

  private async getFallbackOptionsChain(
    symbol: string, 
    underlyingPrice: number, 
    expiration?: string,
    useCache: boolean = true
  ): Promise<EnrichedOptionsChain> {
    // Import Yahoo options dynamically to avoid circular dependency
    const { getOptionsChain } = await import('@/lib/options/yahooOptions')
    
    try {
      const yahooChain = await getOptionsChain(symbol, expiration)
      
      // Enrich with calculated Greeks
      const calls = await this.enrichContractsWithGreeks(
        yahooChain.calls.map(c => this.convertYahooContract(c, 'call')),
        underlyingPrice
      )
      
      const puts = await this.enrichContractsWithGreeks(
        yahooChain.puts.map(c => this.convertYahooContract(c, 'put')),
        underlyingPrice
      )

      const enrichedChain: EnrichedOptionsChain = {
        underlying: symbol,
        underlyingPrice,
        calls,
        puts,
        expirations: yahooChain.expirationDates,
        greeksMetadata: {
          riskFreeRate: this.riskFreeRate,
          calculationTime: Date.now(),
          totalContracts: calls.length + puts.length
        },
        source: 'hybrid' as const,
        timestamp: Date.now()
      }

      if (useCache) {
        await this.cache.setOptionsChain(symbol, enrichedChain, 60, expiration)
      }

      return enrichedChain
    } catch (error) {
      console.error(`Yahoo options also failed for ${symbol}:`, error)
      throw new Error(`Unable to fetch options chain for ${symbol}: All providers failed`)
    }
  }

  private convertYahooContract(contract: any, type: 'call' | 'put'): Partial<EnrichedOptionContract> {
    return {
      symbol: contract.contractSymbol,
      underlying: contract.contractSymbol.split(/\d/)[0], // Extract underlying from contract symbol
      strike: contract.strike,
      expiry: contract.expiration,
      type,
      bid: contract.bid || 0,
      ask: contract.ask || 0,
      last: contract.lastPrice || 0,
      midpoint: ((contract.bid || 0) + (contract.ask || 0)) / 2,
      volume: contract.volume || 0,
      openInterest: contract.openInterest || 0,
      impliedVolatility: contract.impliedVolatility || 0.25
    }
  }

  private async enrichContractsWithGreeks(
    contracts: Partial<EnrichedOptionContract>[],
    underlyingPrice: number
  ): Promise<EnrichedOptionContract[]> {
    return Promise.all(contracts.map(async (contract) => {
      const timeToExpiry = this.calculateTimeToExpiry(contract.expiry!)
      
      const greeksInput: GreeksInput = {
        spotPrice: underlyingPrice,
        strike: contract.strike!,
        timeToExpiry,
        riskFreeRate: this.riskFreeRate,
        volatility: contract.impliedVolatility!
      }

      const greeks = calculateGreeks(greeksInput, contract.type === 'call')
      
      const intrinsicValue = contract.type === 'call'
        ? Math.max(underlyingPrice - contract.strike!, 0)
        : Math.max(contract.strike! - underlyingPrice, 0)

      return {
        symbol: contract.symbol!,
        underlying: contract.underlying!,
        strike: contract.strike!,
        expiry: contract.expiry!,
        type: contract.type!,
        bid: contract.bid!,
        ask: contract.ask!,
        last: contract.last!,
        midpoint: contract.midpoint!,
        volume: contract.volume!,
        openInterest: contract.openInterest!,
        impliedVolatility: contract.impliedVolatility!,
        
        greeks,
        
        moneyness: underlyingPrice / contract.strike!,
        timeValue: contract.last! - intrinsicValue,
        intrinsicValue,
        breakeven: contract.type === 'call' 
          ? contract.strike! + contract.last!
          : contract.strike! - contract.last!,
        probabilityOTM: this.calculateProbabilityOTM(greeks.delta, contract.type!),
        
        source: 'calculated' as const,
        timestamp: Date.now()
      }
    }))
  }

  private async enrichOptionsChain(polygonChain: any, underlyingPrice: number): Promise<EnrichedOptionsChain> {
    // This would be used if Polygon options data was available
    throw new Error('Polygon options enrichment not implemented (requires higher plan)')
  }

  private calculateTimeToExpiry(expiry: string): number {
    const expiryDate = new Date(expiry)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return Math.max(0, diffDays / 365.25)
  }

  private calculateProbabilityOTM(delta: number, type: 'call' | 'put'): number {
    // Simplified probability calculation based on delta
    if (type === 'call') {
      return 1 - Math.abs(delta)
    } else {
      return 1 - Math.abs(delta)
    }
  }

  async batchQuotes(symbols: string[], useCache: boolean = true): Promise<EnrichedQuote[]> {
    const quotes: EnrichedQuote[] = []
    
    // Process in small batches to respect rate limits
    const batchSize = 3
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)
      const batchPromises = batch.map(symbol => this.getQuote(symbol, useCache))
      
      try {
        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            quotes.push(result.value)
          } else {
            console.warn(`Failed to fetch quote for ${batch[index]}:`, result.reason)
          }
        })
        
        // Rate limiting delay between batches
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error('Batch quote error:', error)
      }
    }
    
    return quotes
  }

  // Health check for all services
  async healthCheck(): Promise<{
    polygon: boolean
    cache: boolean
    alphaVantage: boolean
  }> {
    const results = {
      polygon: false,
      cache: false,
      alphaVantage: false
    }

    try {
      await this.polygonClient.getMarketStatus()
      results.polygon = true
    } catch (error) {
      console.warn('Polygon health check failed:', error)
    }

    try {
      results.cache = await this.cache.healthCheck()
    } catch (error) {
      console.warn('Cache health check failed:', error)
    }

    try {
      await getStockData('AAPL')
      results.alphaVantage = true
    } catch (error) {
      console.warn('Alpha Vantage health check failed:', error)
    }

    return results
  }
}

// Singleton instance
let dataService: DataService | null = null

export function getDataService(): DataService {
  if (!dataService) {
    dataService = new DataService()
  }
  return dataService
}

export { DataService }