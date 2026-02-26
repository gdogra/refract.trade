/**
 * Redis Caching Layer
 * Upstash Redis integration for serverless functions
 */

import { Redis } from '@upstash/redis'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class RedisCache {
  private redis!: Redis
  private fallbackCache = new Map<string, CacheItem<any>>()
  private isRedisAvailable = true

  constructor() {
    try {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
      })
    } catch (error) {
      console.warn('Redis initialization failed, using fallback cache:', error)
      this.isRedisAvailable = false
    }
  }

  private generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`
  }

  async get<T>(prefix: string, ...keyParts: string[]): Promise<T | null> {
    const key = this.generateKey(prefix, ...keyParts)

    try {
      if (this.isRedisAvailable) {
        const cached = await this.redis.get<CacheItem<T>>(key)
        if (cached && this.isValidCacheItem(cached)) {
          return cached.data
        }
      } else {
        // Fallback to in-memory cache
        const cached = this.fallbackCache.get(key)
        if (cached && this.isValidCacheItem(cached)) {
          return cached.data as T
        }
      }
    } catch (error) {
      console.warn(`Redis get error for key ${key}:`, error)
      // Try fallback cache
      const cached = this.fallbackCache.get(key)
      if (cached && this.isValidCacheItem(cached)) {
        return cached.data as T
      }
    }

    return null
  }

  async set<T>(prefix: string, data: T, ttlSeconds: number, ...keyParts: string[]): Promise<void> {
    const key = this.generateKey(prefix, ...keyParts)
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    }

    try {
      if (this.isRedisAvailable) {
        await this.redis.set(key, cacheItem, { ex: ttlSeconds })
      }
    } catch (error) {
      console.warn(`Redis set error for key ${key}:`, error)
      this.isRedisAvailable = false
    }

    // Always maintain fallback cache
    this.fallbackCache.set(key, cacheItem)

    // Cleanup old entries in fallback cache
    this.cleanupFallbackCache()
  }

  private isValidCacheItem<T>(item: CacheItem<T>): boolean {
    const now = Date.now()
    return (now - item.timestamp) < item.ttl
  }

  private cleanupFallbackCache(): void {
    const now = Date.now()
    for (const [key, item] of Array.from(this.fallbackCache.entries())) {
      if (!this.isValidCacheItem(item)) {
        this.fallbackCache.delete(key)
      }
    }
  }

  async delete(prefix: string, ...keyParts: string[]): Promise<void> {
    const key = this.generateKey(prefix, ...keyParts)

    try {
      if (this.isRedisAvailable) {
        await this.redis.del(key)
      }
    } catch (error) {
      console.warn(`Redis delete error for key ${key}:`, error)
    }

    this.fallbackCache.delete(key)
  }

  async clear(pattern: string): Promise<void> {
    try {
      if (this.isRedisAvailable) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }
    } catch (error) {
      console.warn(`Redis clear error for pattern ${pattern}:`, error)
    }

    // Clear matching keys from fallback cache
    for (const key of Array.from(this.fallbackCache.keys())) {
      if (key.includes(pattern.replace('*', ''))) {
        this.fallbackCache.delete(key)
      }
    }
  }

  // Specific cache methods for our use cases
  async getQuote(symbol: string): Promise<any | null> {
    return this.get('quote', symbol)
  }

  async setQuote(symbol: string, data: any, ttlSeconds: number = 30): Promise<void> {
    return this.set('quote', data, ttlSeconds, symbol)
  }

  async getOptionsChain(symbol: string, expiry?: string): Promise<any | null> {
    return this.get('options', symbol, expiry || 'nearest')
  }

  async setOptionsChain(symbol: string, data: any, ttlSeconds: number = 60, expiry?: string): Promise<void> {
    return this.set('options', data, ttlSeconds, symbol, expiry || 'nearest')
  }

  async getGreeks(symbol: string, strike: string, expiry: string, type: string): Promise<any | null> {
    return this.get('greeks', symbol, strike, expiry, type)
  }

  async setGreeks(symbol: string, strike: string, expiry: string, type: string, data: any, ttlSeconds: number = 45): Promise<void> {
    return this.set('greeks', data, ttlSeconds, symbol, strike, expiry, type)
  }

  async getPortfolioRisk(userId: string): Promise<any | null> {
    return this.get('portfolio_risk', userId)
  }

  async setPortfolioRisk(userId: string, data: any, ttlSeconds: number = 30): Promise<void> {
    return this.set('portfolio_risk', data, ttlSeconds, userId)
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (this.isRedisAvailable) {
        await this.redis.ping()
        return true
      }
    } catch (error) {
      console.warn('Redis health check failed:', error)
      this.isRedisAvailable = false
    }
    return false
  }
}

// Singleton instance
let cache: RedisCache | null = null

export function getCache(): RedisCache {
  if (!cache) {
    cache = new RedisCache()
  }
  return cache
}

export { RedisCache }