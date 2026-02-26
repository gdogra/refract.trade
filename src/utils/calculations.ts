// Options pricing and Greeks calculations

interface OptionInputs {
  S: number // Current stock price
  K: number // Strike price
  T: number // Time to expiration (years)
  r: number // Risk-free rate
  sigma: number // Volatility
  optionType: 'call' | 'put'
}

// Black-Scholes option pricing
export function blackScholes(inputs: OptionInputs): number {
  const { S, K, T, r, sigma, optionType } = inputs
  
  if (T <= 0) return Math.max(optionType === 'call' ? S - K : K - S, 0)
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)
  
  const N = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)))
  
  if (optionType === 'call') {
    return S * N(d1) - K * Math.exp(-r * T) * N(d2)
  } else {
    return K * Math.exp(-r * T) * N(-d2) - S * N(-d1)
  }
}

// Calculate Delta
export function calculateDelta(inputs: OptionInputs): number {
  const { S, K, T, r, sigma, optionType } = inputs
  
  if (T <= 0) {
    if (optionType === 'call') {
      return S > K ? 1 : 0
    } else {
      return S < K ? -1 : 0
    }
  }
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const N = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)))
  
  if (optionType === 'call') {
    return N(d1)
  } else {
    return N(d1) - 1
  }
}

// Calculate Gamma
export function calculateGamma(inputs: OptionInputs): number {
  const { S, K, T, r, sigma } = inputs
  
  if (T <= 0) return 0
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const phi = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  
  return phi(d1) / (S * sigma * Math.sqrt(T))
}

// Calculate Theta
export function calculateTheta(inputs: OptionInputs): number {
  const { S, K, T, r, sigma, optionType } = inputs
  
  if (T <= 0) return 0
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)
  const phi = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  const N = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)))
  
  const term1 = -(S * phi(d1) * sigma) / (2 * Math.sqrt(T))
  
  if (optionType === 'call') {
    const term2 = -r * K * Math.exp(-r * T) * N(d2)
    return (term1 + term2) / 365 // Convert to daily theta
  } else {
    const term2 = r * K * Math.exp(-r * T) * N(-d2)
    return (term1 + term2) / 365 // Convert to daily theta
  }
}

// Calculate Vega
export function calculateVega(inputs: OptionInputs): number {
  const { S, K, T, r, sigma } = inputs
  
  if (T <= 0) return 0
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const phi = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  
  return S * phi(d1) * Math.sqrt(T) / 100 // Vega per 1% change in volatility
}

// Calculate Rho
export function calculateRho(inputs: OptionInputs): number {
  const { S, K, T, r, sigma, optionType } = inputs
  
  if (T <= 0) return 0
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)
  const N = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)))
  
  if (optionType === 'call') {
    return K * T * Math.exp(-r * T) * N(d2) / 100
  } else {
    return -K * T * Math.exp(-r * T) * N(-d2) / 100
  }
}

// Calculate all Greeks at once
export function calculateGreeks(inputs: OptionInputs) {
  return {
    price: blackScholes(inputs),
    delta: calculateDelta(inputs),
    gamma: calculateGamma(inputs),
    theta: calculateTheta(inputs),
    vega: calculateVega(inputs),
    rho: calculateRho(inputs)
  }
}

// Error function approximation
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

// Portfolio risk calculations
export function calculatePortfolioGreeks(positions: Array<{
  delta: number
  gamma: number
  theta: number
  vega: number
  quantity: number
}>) {
  const totalDelta = positions.reduce((sum, pos) => sum + pos.delta * pos.quantity, 0)
  const totalGamma = positions.reduce((sum, pos) => sum + pos.gamma * pos.quantity, 0)
  const totalTheta = positions.reduce((sum, pos) => sum + pos.theta * pos.quantity, 0)
  const totalVega = positions.reduce((sum, pos) => sum + pos.vega * pos.quantity, 0)
  
  return {
    totalDelta,
    totalGamma,
    totalTheta,
    totalVega
  }
}

// Value at Risk calculation (simplified)
export function calculateVaR(
  returns: number[], 
  confidence: number = 0.95
): number {
  const sortedReturns = returns.sort((a, b) => a - b)
  const index = Math.floor((1 - confidence) * returns?.length || 0)
  return sortedReturns[index] || 0
}

// Maximum Drawdown calculation
export function calculateMaxDrawdown(values: number[]): number {
  let maxDrawdown = 0
  let peak = values[0]
  
  for (const value of values) {
    if (value > peak) {
      peak = value
    }
    
    const drawdown = (peak - value) / peak
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  return maxDrawdown
}

// Sharpe Ratio calculation
export function calculateSharpeRatio(
  returns: number[], 
  riskFreeRate: number = 0.02
): number {
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns?.length || 0
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns?.length || 0
  const stdDev = Math.sqrt(variance)
  
  return (avgReturn - riskFreeRate) / stdDev
}

// Implied Volatility calculation using Newton-Raphson method
export function calculateImpliedVolatility(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  optionType: 'call' | 'put'
): number {
  let sigma = 0.3 // Initial guess
  const tolerance = 0.0001
  const maxIterations = 100
  
  for (let i = 0; i < maxIterations; i++) {
    const price = blackScholes({ S, K, T, r, sigma, optionType })
    const vega = calculateVega({ S, K, T, r, sigma, optionType })
    
    const diff = price - marketPrice
    
    if (Math.abs(diff) < tolerance) {
      return sigma
    }
    
    if (vega === 0) break
    
    sigma = sigma - diff / vega
    
    // Ensure sigma stays positive
    sigma = Math.max(sigma, 0.001)
  }
  
  return sigma
}

// Probability of profit calculation
export function calculateProbabilityOfProfit(
  strategy: {
    legs: Array<{
      optionType: 'call' | 'put'
      strike: number
      quantity: number
      side: 'buy' | 'sell'
    }>
    maxProfit: number
    maxLoss: number
    breakeven: number[]
  },
  currentPrice: number,
  volatility: number,
  timeToExpiry: number
): number {
  // Simplified calculation - in practice would use Monte Carlo simulation
  const expectedMove = currentPrice * volatility * Math.sqrt(timeToExpiry / 365)
  
  // Calculate probability based on breakeven points
  let probProfit = 0
  
  for (const breakeven of strategy.breakeven) {
    const distance = Math.abs(breakeven - currentPrice)
    const probability = 1 - (distance / expectedMove)
    probProfit += Math.max(probability, 0)
  }
  
  return Math.min(probProfit / strategy.breakeven?.length || 0, 1)
}