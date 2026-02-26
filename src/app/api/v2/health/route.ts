/**
 * System Health Check API v2
 * Monitors all data layer components
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataService } from '@/lib/data-layer/data-service'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const dataService = getDataService()
    
    // Run comprehensive health checks
    const healthResults = await dataService.healthCheck()
    
    const overallHealth = Object.values(healthResults).every(status => status)
    const responseTime = Date.now() - startTime

    const response = {
      success: true,
      status: overallHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      services: {
        polygon: {
          status: healthResults.polygon ? 'healthy' : 'unhealthy',
          description: healthResults.polygon 
            ? 'Polygon API responding normally' 
            : 'Polygon API unreachable or rate limited'
        },
        finnhub: {
          status: healthResults.finnhub ? 'healthy' : 'unhealthy',
          description: healthResults.finnhub 
            ? 'Finnhub API responding normally' 
            : 'Finnhub API unreachable or rate limited'
        },
        cache: {
          status: healthResults.cache ? 'healthy' : 'degraded',
          description: healthResults.cache 
            ? 'Redis cache operational' 
            : 'Using fallback in-memory cache'
        },
        alphaVantage: {
          status: healthResults.alphaVantage ? 'healthy' : 'unhealthy',
          description: healthResults.alphaVantage 
            ? 'Alpha Vantage API responding normally' 
            : 'Alpha Vantage API unreachable'
        }
      },
      architecture: {
        dataLayer: 'v2',
        greeksCalculation: 'server-side',
        caching: 'redis-hybrid',
        rateLimit: 'optimized'
      },
      capabilities: {
        realTimeQuotes: healthResults.polygon || healthResults.finnhub || healthResults.alphaVantage,
        optionsChain: true, // Yahoo fallback always available
        calculatedGreeks: true,
        portfolioRisk: true,
        batchQuotes: healthResults.polygon || healthResults.finnhub || healthResults.alphaVantage
      },
      performance: {
        avgResponseTime: responseTime,
        cacheHitRate: 'N/A', // Would track this in production
        quotesPerMinute: healthResults.polygon ? 5 : (healthResults.finnhub ? 60 : (healthResults.alphaVantage ? 10 : 0))
      }
    }

    // Set appropriate status code
    const statusCode = overallHealth ? 200 : 
                      (healthResults.alphaVantage || healthResults.finnhub || healthResults.polygon) ? 206 : 503

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
      services: {
        polygon: { status: 'unknown', description: 'Health check failed' },
        cache: { status: 'unknown', description: 'Health check failed' },
        alphaVantage: { status: 'unknown', description: 'Health check failed' }
      }
    }, { status: 503 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}