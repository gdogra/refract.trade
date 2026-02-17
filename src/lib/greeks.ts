/**
 * Black-Scholes Greeks Calculation Engine
 * Professional-grade options pricing and Greeks calculations
 */

export interface GreeksInput {
  spotPrice: number      // Current price of underlying
  strike: number         // Strike price of option
  timeToExpiry: number   // Time to expiry in years (e.g., 30 days = 30/365)
  riskFreeRate: number   // Risk-free rate (e.g., 0.05 for 5%)
  volatility: number     // Annualized volatility (e.g., 0.20 for 20%)
  dividendYield?: number // Dividend yield (default: 0)
}

export interface Greeks {
  price: number      // Theoretical option price
  delta: number      // Price sensitivity to underlying
  gamma: number      // Delta sensitivity to underlying
  theta: number      // Time decay (per day)
  vega: number       // Volatility sensitivity
  rho: number        // Interest rate sensitivity
  impliedVolatility?: number // Only for market prices
}

export interface PortfolioGreeks {
  totalDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
  totalRho: number
  netLiquidation: number
  portfolioBeta: number
  maxRisk: number
}

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal probability density function
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate d1 parameter for Black-Scholes
 */
function calculateD1(input: GreeksInput): number {
  const { spotPrice, strike, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = input;
  
  if (timeToExpiry <= 0) return 0;
  
  return (Math.log(spotPrice / strike) + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) / 
         (volatility * Math.sqrt(timeToExpiry));
}

/**
 * Calculate d2 parameter for Black-Scholes
 */
function calculateD2(input: GreeksInput, d1: number): number {
  const { volatility, timeToExpiry } = input;
  return d1 - volatility * Math.sqrt(timeToExpiry);
}

/**
 * Calculate theoretical option price using Black-Scholes
 */
export function calculateOptionPrice(input: GreeksInput, isCall: boolean = true): number {
  const { spotPrice, strike, timeToExpiry, riskFreeRate, dividendYield = 0 } = input;
  
  // Handle edge cases
  if (timeToExpiry <= 0) {
    if (isCall) {
      return Math.max(spotPrice - strike, 0);
    } else {
      return Math.max(strike - spotPrice, 0);
    }
  }
  
  if (spotPrice <= 0 || strike <= 0 || input.volatility <= 0) {
    return 0;
  }
  
  const d1 = calculateD1(input);
  const d2 = calculateD2(input, d1);
  
  const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);
  const dividendFactor = Math.exp(-dividendYield * timeToExpiry);
  
  if (isCall) {
    return spotPrice * dividendFactor * normalCDF(d1) - strike * discountFactor * normalCDF(d2);
  } else {
    return strike * discountFactor * normalCDF(-d2) - spotPrice * dividendFactor * normalCDF(-d1);
  }
}

/**
 * Calculate all Greeks for an option
 */
export function calculateGreeks(input: GreeksInput, isCall: boolean = true): Greeks {
  const { spotPrice, strike, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = input;
  
  // Handle expired options
  if (timeToExpiry <= 0) {
    const intrinsicValue = isCall ? Math.max(spotPrice - strike, 0) : Math.max(strike - spotPrice, 0);
    return {
      price: intrinsicValue,
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    };
  }
  
  // Handle invalid inputs
  if (spotPrice <= 0 || strike <= 0 || volatility <= 0) {
    return {
      price: 0,
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    };
  }
  
  const d1 = calculateD1(input);
  const d2 = calculateD2(input, d1);
  const price = calculateOptionPrice(input, isCall);
  
  const sqrtTime = Math.sqrt(timeToExpiry);
  const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);
  const dividendFactor = Math.exp(-dividendYield * timeToExpiry);
  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const pdf_d1 = normalPDF(d1);
  
  let delta: number;
  let rho: number;
  let theta: number;
  
  if (isCall) {
    delta = dividendFactor * nd1;
    rho = strike * timeToExpiry * discountFactor * nd2 / 100; // Convert to per 1% change
    
    theta = (
      -spotPrice * dividendFactor * pdf_d1 * volatility / (2 * sqrtTime) -
      riskFreeRate * strike * discountFactor * nd2 +
      dividendYield * spotPrice * dividendFactor * nd1
    ) / 365; // Convert to per day
  } else {
    delta = -dividendFactor * normalCDF(-d1);
    rho = -strike * timeToExpiry * discountFactor * normalCDF(-d2) / 100; // Convert to per 1% change
    
    theta = (
      -spotPrice * dividendFactor * pdf_d1 * volatility / (2 * sqrtTime) +
      riskFreeRate * strike * discountFactor * normalCDF(-d2) -
      dividendYield * spotPrice * dividendFactor * normalCDF(-d1)
    ) / 365; // Convert to per day
  }
  
  const gamma = dividendFactor * pdf_d1 / (spotPrice * volatility * sqrtTime);
  const vega = spotPrice * dividendFactor * pdf_d1 * sqrtTime / 100; // Convert to per 1% vol change
  
  return {
    price: Number(price.toFixed(4)),
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    theta: Number(theta.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    rho: Number(rho.toFixed(4))
  };
}

/**
 * Calculate time to expiry in years from expiration date
 */
export function getTimeToExpiry(expirationDate: string | Date): number {
  const expiry = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Return 0 if expired, otherwise return fraction of year
  return Math.max(0, diffDays / 365.25);
}

/**
 * Calculate implied volatility using Newton-Raphson method
 */
export function calculateImpliedVolatility(
  marketPrice: number,
  input: Omit<GreeksInput, 'volatility'>,
  isCall: boolean = true,
  tolerance: number = 0.001,
  maxIterations: number = 100
): number {
  let volatility = 0.30; // Initial guess: 30% vol
  
  for (let i = 0; i < maxIterations; i++) {
    const fullInput = { ...input, volatility };
    const theoreticalPrice = calculateOptionPrice(fullInput, isCall);
    const vega = calculateGreeks(fullInput, isCall).vega * 100; // Convert back from per 1% change
    
    const priceDiff = theoreticalPrice - marketPrice;
    
    if (Math.abs(priceDiff) < tolerance) {
      return Number(volatility.toFixed(4));
    }
    
    if (vega === 0) break; // Avoid division by zero
    
    volatility = volatility - priceDiff / vega;
    
    // Keep volatility within reasonable bounds
    volatility = Math.max(0.001, Math.min(5.0, volatility));
  }
  
  return Number(volatility.toFixed(4));
}

/**
 * Calculate portfolio-level Greeks
 */
export function calculatePortfolioGreeks(
  positions: Array<{
    symbol: string;
    type: 'call' | 'put';
    strike: number;
    expiry: string | Date;
    quantity: number;
    spotPrice: number;
    volatility: number;
    riskFreeRate?: number;
    dividendYield?: number;
  }>
): PortfolioGreeks {
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;
  let totalRho = 0;
  let netLiquidation = 0;
  
  for (const position of positions) {
    const timeToExpiry = getTimeToExpiry(position.expiry);
    
    if (timeToExpiry <= 0) continue; // Skip expired positions
    
    const input: GreeksInput = {
      spotPrice: position.spotPrice,
      strike: position.strike,
      timeToExpiry,
      riskFreeRate: position.riskFreeRate || 0.05,
      volatility: position.volatility,
      dividendYield: position.dividendYield || 0
    };
    
    const greeks = calculateGreeks(input, position.type === 'call');
    const multiplier = position.quantity * 100; // Each contract = 100 shares
    
    totalDelta += greeks.delta * multiplier;
    totalGamma += greeks.gamma * multiplier;
    totalTheta += greeks.theta * multiplier;
    totalVega += greeks.vega * multiplier;
    totalRho += greeks.rho * multiplier;
    netLiquidation += greeks.price * multiplier;
  }
  
  // Calculate portfolio beta (simplified - assumes correlation with market)
  const portfolioBeta = totalDelta / 10000; // Rough approximation
  
  // Estimate maximum risk (simplified VaR calculation)
  const maxRisk = Math.abs(totalDelta * 0.1) + Math.abs(totalVega * 0.05); // 10% price move + 5% vol move
  
  return {
    totalDelta: Number(totalDelta.toFixed(2)),
    totalGamma: Number(totalGamma.toFixed(2)),
    totalTheta: Number(totalTheta.toFixed(2)),
    totalVega: Number(totalVega.toFixed(2)),
    totalRho: Number(totalRho.toFixed(2)),
    netLiquidation: Number(netLiquidation.toFixed(2)),
    portfolioBeta: Number(portfolioBeta.toFixed(2)),
    maxRisk: Number(maxRisk.toFixed(2))
  };
}

/**
 * Batch calculate Greeks for multiple positions (optimized)
 */
export function batchCalculateGreeks(
  positions: Array<{
    id: string;
    symbol: string;
    type: 'call' | 'put';
    strike: number;
    expiry: string | Date;
    quantity: number;
    spotPrice: number;
    volatility: number;
    riskFreeRate?: number;
    dividendYield?: number;
  }>
): Array<{ id: string; greeks: Greeks }> {
  return positions.map(position => {
    const timeToExpiry = getTimeToExpiry(position.expiry);
    
    const input: GreeksInput = {
      spotPrice: position.spotPrice,
      strike: position.strike,
      timeToExpiry,
      riskFreeRate: position.riskFreeRate || 0.05,
      volatility: position.volatility,
      dividendYield: position.dividendYield || 0
    };
    
    const greeks = calculateGreeks(input, position.type === 'call');
    
    return {
      id: position.id,
      greeks
    };
  });
}

/**
 * Calculate P&L scenarios for different underlying price movements
 */
export function calculatePnLScenarios(
  positions: Array<{
    symbol: string;
    type: 'call' | 'put';
    strike: number;
    expiry: string | Date;
    quantity: number;
    entryPrice: number;
    spotPrice: number;
    volatility: number;
    riskFreeRate?: number;
    dividendYield?: number;
  }>,
  priceRange: { min: number; max: number; steps: number }
): Array<{ price: number; pnl: number }> {
  const scenarios: Array<{ price: number; pnl: number }> = [];
  const step = (priceRange.max - priceRange.min) / priceRange.steps;
  
  for (let i = 0; i <= priceRange.steps; i++) {
    const scenarioPrice = priceRange.min + (i * step);
    let totalPnL = 0;
    
    for (const position of positions) {
      const timeToExpiry = getTimeToExpiry(position.expiry);
      
      if (timeToExpiry <= 0) {
        // Handle expiration
        const intrinsicValue = position.type === 'call' 
          ? Math.max(scenarioPrice - position.strike, 0)
          : Math.max(position.strike - scenarioPrice, 0);
        
        totalPnL += (intrinsicValue - position.entryPrice) * position.quantity * 100;
      } else {
        // Calculate theoretical value at scenario price
        const input: GreeksInput = {
          spotPrice: scenarioPrice,
          strike: position.strike,
          timeToExpiry,
          riskFreeRate: position.riskFreeRate || 0.05,
          volatility: position.volatility,
          dividendYield: position.dividendYield || 0
        };
        
        const theoreticalValue = calculateOptionPrice(input, position.type === 'call');
        totalPnL += (theoreticalValue - position.entryPrice) * position.quantity * 100;
      }
    }
    
    scenarios.push({
      price: Number(scenarioPrice.toFixed(2)),
      pnl: Number(totalPnL.toFixed(2))
    });
  }
  
  return scenarios;
}