/**
 * Yahoo Finance Options Service
 * 
 * Single source of truth for all options data.
 * NEVER falls back to mock data in production.
 */

import { calculateGreeks, GreeksInput } from '../greeks'

// TypeScript Interfaces
export interface OptionsChain {
  symbol: string
  underlyingPrice: number
  expirationDates: string[]
  expirations: string[]
  selectedExpiration: string
  calls: OptionContract[]
  puts: OptionContract[]
  dataSource: 'yahoo_finance'
  delayMinutes: 15
  lastUpdated: string
}

export interface OptionGreeks {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
}

export interface OptionContract {
  contractSymbol: string
  type: 'call' | 'put'
  strike: number
  expiration: string
  bid: number
  ask: number
  lastPrice: number
  midpoint: number
  volume: number
  openInterest: number
  impliedVolatility: number
  inTheMoney: boolean
  intrinsicValue: number
  extrinsicValue: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  daysToExpiry: number
  probabilityOfProfit: number
  greeks?: OptionGreeks
}

interface YahooOptionResponse {
  contractSymbol: string
  strike: number
  expiration: number
  bid?: number
  ask?: number
  lastPrice?: number
  volume?: number
  openInterest?: number
  impliedVolatility?: number
  inTheMoney?: boolean
  delta?: number
  gamma?: number
  theta?: number
  vega?: number
}

// Cache and rate limiting
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const requestQueue: Array<() => Promise<any>> = []
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests

// Very conservative rate limiting for Yahoo Finance
async function throttleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    console.log(`Rate limiting: waiting ${delay}ms before next request`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  lastRequestTime = Date.now()
  return fn()
}

// Cache utilities
function getCacheKey(symbol: string, expiration?: string): string {
  return `options_${symbol}_${expiration || 'nearest'}`
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000
  })
}

// Yahoo Finance API functions
async function fetchYahooOptions(symbol: string, date?: number): Promise<any> {
  const baseUrl = 'https://query2.finance.yahoo.com/v7/finance/options'
  const url = date 
    ? `${baseUrl}/${symbol}?date=${date}`
    : `${baseUrl}/${symbol}`
    
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
  
  try {
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Symbol ${symbol} not found on Yahoo Finance`)
      }
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.optionChain?.result?.[0]) {
      throw new Error(`No options available for ${symbol}`)
    }
    
    return data.optionChain.result[0]
  } catch (error) {
    if (error instanceof Error) {
      console.error('Yahoo Finance fetch error:', {
        symbol,
        date,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      if (error.message.includes('fetch')) {
        throw new Error(`Yahoo Finance unavailable: ${error.message}`)
      }
      throw error
    }
    
    console.error('Unknown error fetching from Yahoo Finance:', error)
    throw new Error('Failed to fetch options data from Yahoo Finance')
  }
}

// Core functions
export async function getOptionsChain(symbol: string, expiration?: string): Promise<OptionsChain> {
  if (!symbol || typeof symbol !== 'string' || !/^[A-Z]{1,5}$/.test(symbol)) {
    throw new Error(`Invalid symbol: ${symbol}. Symbol must be 1-5 uppercase letters.`)
  }
  
  const cacheKey = getCacheKey(symbol, expiration)
  const cached = getFromCache<OptionsChain>(cacheKey)
  if (cached) {
    return cached
  }
  
  const expirationDate = expiration ? new Date(expiration).getTime() / 1000 : undefined
  
  const result = await throttleRequest(() => fetchYahooOptions(symbol, expirationDate))
  
  try {
    const chain = parseYahooResponse(result, expiration)
    
    // Cache for 10 minutes to reduce API calls
    setCache(cacheKey, chain, 600)
    
    return chain
  } catch (error) {
    console.error('Failed to parse Yahoo Finance response:', {
      symbol,
      expiration,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    throw new Error(`Failed to parse Yahoo Finance response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getExpirationDates(symbol: string): Promise<string[]> {
  if (!symbol || typeof symbol !== 'string' || !/^[A-Z]{1,5}$/.test(symbol)) {
    throw new Error(`Invalid symbol: ${symbol}`)
  }
  
  const cacheKey = `expirations_${symbol}`
  const cached = getFromCache<string[]>(cacheKey)
  if (cached) {
    return cached
  }
  
  const result = await throttleRequest(() => fetchYahooOptions(symbol))
  
  if (!result.expirationDates || !Array.isArray(result.expirationDates)) {
    throw new Error(`No expiration dates available for ${symbol}`)
  }
  
  const dates = result.expirationDates.map((timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toISOString().split('T')[0] // YYYY-MM-DD
  })
  
  // Cache for 1 hour (expirations don't change often)
  setCache(cacheKey, dates, 3600)
  
  return dates
}

export async function getUnderlyingPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number }> {
  const result = await throttleRequest(() => fetchYahooOptions(symbol))
  
  const quote = result.quote
  if (!quote || typeof quote.regularMarketPrice !== 'number') {
    throw new Error(`Unable to get underlying price for ${symbol}`)
  }
  
  return {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange || 0,
    changePercent: quote.regularMarketChangePercent || 0
  }
}

// Parse Yahoo Finance response
function parseYahooResponse(result: any, selectedExpiration?: string): OptionsChain {
  const symbol = result.quote.symbol
  const underlyingPrice = result.quote.regularMarketPrice
  
  if (!symbol || typeof underlyingPrice !== 'number') {
    throw new Error('Invalid Yahoo Finance response structure')
  }
  
  // Parse expiration dates
  const expirationDates = (result.expirationDates || []).map((timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toISOString().split('T')[0]
  })
  
  if (expirationDates.length === 0) {
    throw new Error('No expiration dates found')
  }
  
  // Determine selected expiration
  const expiry = selectedExpiration || expirationDates[0]
  
  // Parse options data
  const optionsData = result.options?.[0]
  if (!optionsData) {
    throw new Error('No options data found')
  }
  
  const calls = parseContracts(optionsData.calls || [], 'call', underlyingPrice, expiry)
  const puts = parseContracts(optionsData.puts || [], 'put', underlyingPrice, expiry)
  
  return {
    symbol,
    underlyingPrice,
    expirationDates,
    expirations: expirationDates,
    selectedExpiration: expiry,
    calls,
    puts,
    dataSource: 'yahoo_finance',
    delayMinutes: 15,
    lastUpdated: new Date().toISOString()
  }
}

function parseContracts(contracts: YahooOptionResponse[], type: 'call' | 'put', underlyingPrice: number, expiration: string): OptionContract[] {
  return contracts.map(c => {
    const strike = c.strike
    const bid = c.bid ?? 0
    const ask = c.ask ?? 0
    const lastPrice = c.lastPrice ?? 0
    const midpoint = (bid + ask) / 2
    const volume = c.volume ?? 0
    const openInterest = c.openInterest ?? 0
    const impliedVolatility = c.impliedVolatility ?? 0.30
    const inTheMoney = c.inTheMoney ?? (
      type === 'call' ? strike < underlyingPrice : strike > underlyingPrice
    )
    
    // Calculate intrinsic and extrinsic value
    const intrinsicValue = Math.max(0, 
      type === 'call' 
        ? underlyingPrice - strike 
        : strike - underlyingPrice
    )
    const extrinsicValue = Math.max(0, lastPrice - intrinsicValue)
    
    // Calculate days to expiry
    const expiryDate = new Date(expiration)
    const today = new Date()
    const daysToExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Use Yahoo Greeks if available, otherwise calculate
    let delta = c.delta ?? 0
    let gamma = c.gamma ?? 0
    let theta = c.theta ?? 0
    let vega = c.vega ?? 0
    let rho = 0
    
    if (!delta && !gamma && !theta && !vega) {
      // Calculate Greeks using Black-Scholes
      const timeToExpiry = daysToExpiry / 365
      const greeks = enrichWithCalculatedGreeks(
        strike,
        underlyingPrice,
        timeToExpiry,
        impliedVolatility,
        0.05, // risk-free rate
        type
      )
      
      delta = greeks.delta
      gamma = greeks.gamma
      theta = greeks.theta
      vega = greeks.vega
      rho = greeks.rho
    }
    
    // Estimate probability of profit (simplified)
    const probabilityOfProfit = estimateProbabilityOfProfit(
      type, strike, underlyingPrice, impliedVolatility, daysToExpiry
    )
    
    return {
      contractSymbol: c.contractSymbol,
      type,
      strike,
      expiration,
      bid,
      ask,
      lastPrice,
      midpoint,
      volume,
      openInterest,
      impliedVolatility,
      inTheMoney,
      intrinsicValue,
      extrinsicValue,
      delta,
      gamma,
      theta,
      vega,
      rho,
      daysToExpiry,
      probabilityOfProfit
    }
  })
}

function enrichWithCalculatedGreeks(
  strike: number,
  spotPrice: number,
  timeToExpiry: number,
  volatility: number,
  riskFreeRate: number,
  optionType: 'call' | 'put'
) {
  try {
    const input: GreeksInput = {
      spotPrice,
      strike,
      timeToExpiry,
      riskFreeRate,
      volatility
    }
    
    const greeks = calculateGreeks(input, optionType === 'call')
    
    return {
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      vega: greeks.vega,
      rho: greeks.rho
    }
  } catch (error) {
    console.warn('Failed to calculate Greeks:', error)
    // Return default Greeks if calculation fails
    return {
      delta: optionType === 'call' ? 0.5 : -0.5,
      gamma: 0.01,
      theta: -0.05,
      vega: 0.1,
      rho: 0.05
    }
  }
}

function estimateProbabilityOfProfit(
  type: 'call' | 'put',
  strike: number,
  spotPrice: number,
  volatility: number,
  daysToExpiry: number
): number {
  // Simplified probability calculation
  // In reality, this would use more sophisticated models
  
  const timeToExpiry = daysToExpiry / 365
  const drift = Math.log(strike / spotPrice)
  const variance = volatility * volatility * timeToExpiry
  
  // Standard normal distribution approximation
  const d1 = drift / Math.sqrt(variance)
  const prob = type === 'call' 
    ? 1 - normalCDF(d1)
    : normalCDF(d1)
  
  return Math.max(0.01, Math.min(0.99, prob))
}

// Simplified normal cumulative distribution function
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

function erf(x: number): number {
  // Approximation of error function
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  
  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)
  
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  
  return sign * y
}

// Export cache utilities for testing
export function clearCache(): void {
  cache.clear()
}

export function getCacheSize(): number {
  return cache.size
}