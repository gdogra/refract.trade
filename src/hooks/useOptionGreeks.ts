import { useMemo } from 'react'
import { OptionContract } from '@/lib/options/yahooOptions'
import { calculateGreeks, GreeksInput } from '@/lib/greeks'

interface UseOptionGreeksReturn {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  probabilityOfProfit: number
  source: 'yahoo' | 'calculated'
}

export function useOptionGreeks(
  contract: OptionContract | null,
  underlyingPrice?: number
): UseOptionGreeksReturn {
  
  return useMemo(() => {
    if (!contract) {
      return {
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        probabilityOfProfit: 0,
        source: 'calculated'
      }
    }
    
    // Check if contract already has Greeks from Yahoo
    const hasYahooGreeks = contract.delta !== 0 || contract.gamma !== 0 || 
                          contract.theta !== 0 || contract.vega !== 0
    
    if (hasYahooGreeks) {
      return {
        delta: contract.delta,
        gamma: contract.gamma,
        theta: contract.theta,
        vega: contract.vega,
        rho: contract.rho,
        probabilityOfProfit: contract.probabilityOfProfit,
        source: 'yahoo'
      }
    }
    
    // Calculate Greeks using Black-Scholes if not available from Yahoo
    const currentPrice = underlyingPrice || 0
    if (currentPrice === 0 || contract.daysToExpiry === 0) {
      return {
        delta: contract.type === 'call' ? 0.5 : -0.5,
        gamma: 0.01,
        theta: -0.05,
        vega: 0.1,
        rho: 0.05,
        probabilityOfProfit: contract.probabilityOfProfit,
        source: 'calculated'
      }
    }
    
    try {
      const input: GreeksInput = {
        spotPrice: currentPrice,
        strike: contract.strike,
        timeToExpiry: contract.daysToExpiry / 365,
        riskFreeRate: 0.05,
        volatility: contract.impliedVolatility || 0.30
      }
      
      const greeks = calculateGreeks(input, contract.type === 'call')
      
      return {
        delta: greeks.delta,
        gamma: greeks.gamma,
        theta: greeks.theta,
        vega: greeks.vega,
        rho: greeks.rho,
        probabilityOfProfit: contract.probabilityOfProfit,
        source: 'calculated'
      }
      
    } catch (error) {
      console.warn('Failed to calculate Greeks for contract:', contract.contractSymbol, error)
      
      // Return sensible defaults
      return {
        delta: contract.type === 'call' ? 0.5 : -0.5,
        gamma: 0.01,
        theta: -0.05,
        vega: 0.1,
        rho: 0.05,
        probabilityOfProfit: contract.probabilityOfProfit,
        source: 'calculated'
      }
    }
  }, [contract, underlyingPrice])
}