# Technical Specifications - Refract.trade Options SaaS Platform

## System Architecture Overview

### Technology Stack

#### Frontend Stack
```typescript
// Core Framework
Next.js 14 (App Router)
TypeScript 5.0+ (strict mode)
React 18 with Server Components

// Styling & UI
Tailwind CSS 3.0
shadcn/ui component library
Framer Motion for animations
Lucide React for icons

// State Management
Zustand for client state
React Query for server state
React Hook Form for forms
Zod for validation

// Real-time
Socket.io client
WebRTC for live features
Service Workers for offline

// Analytics & Monitoring
PostHog for product analytics
Sentry for error tracking
Vercel Analytics for performance
```

#### Backend Stack
```typescript
// Runtime & Framework
Node.js 20+ 
Next.js API routes
tRPC for type-safe APIs
Zod for validation

// Database
PostgreSQL 15 (primary)
Prisma ORM
TimescaleDB (time series)
Redis (caching & sessions)
ClickHouse (analytics)

// Authentication & Security
NextAuth.js with OAuth
JWT tokens
RBAC permissions
Rate limiting (Upstash)

// Background Processing
BullMQ with Redis
Cron jobs for data updates
WebSocket server for real-time

// External Integrations
Polygon.io (market data)
Alpha Vantage (backup data)
Yahoo Finance (free tier)
OpenAI GPT-4 (analysis)
Stripe (payments)
```

#### Infrastructure Stack
```yaml
# Hosting & Deployment
Frontend: Vercel (Edge Functions)
Backend: Railway or Render
Database: PlanetScale or Supabase
Cache: Upstash Redis
CDN: Vercel Edge Network

# Monitoring & Logging
Application: Datadog
Errors: Sentry
Uptime: Pingdom
Logs: Logtail

# Security & Compliance
SSL: Automatic (Vercel)
WAF: Cloudflare
Secrets: Vercel Environment Variables
Backup: Automated daily snapshots
```

## Database Schema

### Core Tables

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  subscription_tier subscription_tier_enum DEFAULT 'free',
  risk_tolerance risk_tolerance_enum DEFAULT 'moderate',
  options_experience experience_level_enum DEFAULT 'beginner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE
);

-- Subscriptions & Billing
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier subscription_tier_enum NOT NULL,
  status subscription_status_enum NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio & Positions
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  broker_name VARCHAR(100),
  account_number VARCHAR(255),
  total_value DECIMAL(15,2),
  available_cash DECIMAL(15,2),
  buying_power DECIMAL(15,2),
  day_trade_buying_power DECIMAL(15,2),
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, account_number)
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  quantity DECIMAL(15,4),
  average_cost DECIMAL(15,4),
  market_value DECIMAL(15,2),
  unrealized_pnl DECIMAL(15,2),
  position_type position_type_enum NOT NULL,
  
  -- Options-specific fields
  option_type option_type_enum NULL,
  strike_price DECIMAL(15,4) NULL,
  expiration_date DATE NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(portfolio_id, symbol),
  INDEX(expiration_date) WHERE expiration_date IS NOT NULL
);

-- Market Data
CREATE TABLE symbols (
  symbol VARCHAR(10) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  market_cap BIGINT,
  is_optionable BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE option_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) REFERENCES symbols(symbol),
  expiration_date DATE NOT NULL,
  strike_price DECIMAL(15,4) NOT NULL,
  option_type option_type_enum NOT NULL,
  
  -- Pricing data
  bid DECIMAL(10,4),
  ask DECIMAL(10,4),
  last_price DECIMAL(10,4),
  volume INTEGER DEFAULT 0,
  open_interest INTEGER DEFAULT 0,
  
  -- Greeks
  delta DECIMAL(8,6),
  gamma DECIMAL(8,6), 
  theta DECIMAL(8,6),
  vega DECIMAL(8,6),
  rho DECIMAL(8,6),
  implied_volatility DECIMAL(8,6),
  
  -- Metadata
  timestamp TIMESTAMP DEFAULT NOW(),
  data_source VARCHAR(50),
  
  UNIQUE(symbol, expiration_date, strike_price, option_type, DATE(timestamp)),
  INDEX(symbol, expiration_date),
  INDEX(timestamp)
);

-- Historical price data (TimescaleDB)
CREATE TABLE historical_prices (
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  open_price DECIMAL(15,4),
  high_price DECIMAL(15,4), 
  low_price DECIMAL(15,4),
  close_price DECIMAL(15,4),
  volume BIGINT,
  adjusted_close DECIMAL(15,4),
  
  PRIMARY KEY(symbol, date)
);

-- Recommendations & Analysis
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) REFERENCES symbols(symbol),
  option_type option_type_enum NOT NULL,
  strike_price DECIMAL(15,4) NOT NULL,
  expiration_date DATE NOT NULL,
  
  -- Recommendation details
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  expected_move DECIMAL(10,4),
  max_profit DECIMAL(15,2),
  max_loss DECIMAL(15,2),
  breakeven_price DECIMAL(15,4),
  probability_of_profit DECIMAL(5,4),
  
  -- Analysis
  reasoning TEXT NOT NULL,
  technical_analysis JSONB,
  fundamental_analysis JSONB,
  news_analysis JSONB,
  risk_factors JSONB,
  catalysts JSONB,
  
  -- Portfolio impact (for portfolio-aware recommendations)
  portfolio_impact JSONB,
  quality_score JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- When recommendation becomes stale
  viewed_at TIMESTAMP NULL,
  
  INDEX(user_id, created_at),
  INDEX(symbol, created_at),
  INDEX(expires_at)
);

-- Usage Tracking & Compliance
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_type usage_metric_enum NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  limit_exceeded_count INTEGER DEFAULT 0,
  
  UNIQUE(user_id, metric_type, period_start)
);

CREATE TABLE compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type compliance_action_enum NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  
  -- Compliance tracking
  disclaimer_shown BOOLEAN DEFAULT FALSE,
  disclaimer_accepted BOOLEAN DEFAULT FALSE,
  risk_warning_shown BOOLEAN DEFAULT FALSE,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  request_metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id, created_at),
  INDEX(action_type, created_at)
);

-- Social Features
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position_data JSONB, -- Optional position information
  tags VARCHAR(50)[],
  
  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  moderation_status moderation_status_enum DEFAULT 'approved',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id, created_at),
  INDEX(created_at DESC),
  INDEX USING GIN(tags)
);

-- Alerts & Notifications
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type alert_type_enum NOT NULL,
  symbol VARCHAR(10),
  condition_data JSONB NOT NULL,
  
  -- Trigger settings
  is_active BOOLEAN DEFAULT TRUE,
  trigger_once BOOLEAN DEFAULT FALSE,
  
  -- Notification preferences  
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  
  -- Status
  triggered_at TIMESTAMP NULL,
  last_checked TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id, is_active),
  INDEX(symbol, alert_type),
  INDEX(last_checked) WHERE is_active = TRUE
);
```

### Enums & Types
```sql
-- Subscription tiers
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'pro', 'elite', 'enterprise');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'canceled', 'past_due', 'incomplete');

-- Trading related
CREATE TYPE position_type_enum AS ENUM ('stock', 'option');
CREATE TYPE option_type_enum AS ENUM ('call', 'put');
CREATE TYPE risk_tolerance_enum AS ENUM ('conservative', 'moderate', 'aggressive');
CREATE TYPE experience_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Usage tracking
CREATE TYPE usage_metric_enum AS ENUM (
  'daily_recommendations', 'daily_scans', 'api_calls', 'alerts_created'
);

-- Compliance
CREATE TYPE compliance_action_enum AS ENUM (
  'view_recommendation', 'generate_strategy', 'export_data', 'api_call', 'share_trade'
);

-- Content moderation
CREATE TYPE moderation_status_enum AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- Alert types
CREATE TYPE alert_type_enum AS ENUM (
  'price_target', 'volume_spike', 'iv_change', 'earnings_date', 'risk_warning', 'opportunity'
);
```

## API Design

### REST Endpoints

#### Authentication
```typescript
POST /api/auth/signup
POST /api/auth/signin
GET /api/auth/session
POST /api/auth/signout

// OAuth providers
GET /api/auth/[...nextauth]
```

#### Market Data
```typescript
// Options data
GET /api/options/chains/:symbol
GET /api/options/unusual-activity
GET /api/market/quotes
GET /api/market/movers

// Historical data
GET /api/historical/:symbol
GET /api/volatility/:symbol
```

#### Core Features
```typescript
// Recommendations
GET /api/recommendations           // Daily recommendations
POST /api/recommendations          // Custom scan
GET /api/recommendations/:id       // Specific recommendation
PATCH /api/recommendations/track   // Usage tracking

// Portfolio
GET /api/portfolio                 // Portfolio overview
POST /api/portfolio/sync           // Sync with broker
GET /api/portfolio/risk            // Risk analysis
POST /api/portfolio/optimize       // Optimization suggestions

// Strategies  
GET /api/strategies                // Available strategies
POST /api/strategies/analyze       // Analyze custom strategy
GET /api/strategies/backtest       // Backtest results

// Alerts
GET /api/alerts                    // User alerts
POST /api/alerts                   // Create alert
PUT /api/alerts/:id                // Update alert
DELETE /api/alerts/:id             // Delete alert
```

#### Social & Community
```typescript
// Posts & Feed
GET /api/community/feed            // Community feed
POST /api/community/posts          // Create post
GET /api/community/posts/:id       // Get post
PUT /api/community/posts/:id/like  // Like/unlike post

// Users & Following
GET /api/users/:id/profile         // User profile
POST /api/users/:id/follow         // Follow user
GET /api/users/following           // Following list
GET /api/leaderboard              // Top performers
```

#### Analytics & Usage
```typescript
// Usage limits
GET /api/usage/limits              // Current usage vs limits
GET /api/usage/history             // Usage history

// Analytics (internal)
GET /api/analytics/metrics         // Platform metrics
GET /api/analytics/cohorts         // Cohort analysis
POST /api/analytics/track          // Event tracking
```

### WebSocket Events

#### Real-time Market Data
```typescript
// Market updates
'market:quote:${symbol}'          // Real-time quotes
'market:options:${symbol}'        // Options chain updates
'market:news:${symbol}'           // Breaking news
'market:unusual_activity'         // Unusual options activity

// Portfolio updates
'portfolio:position:update'       // Position changes
'portfolio:risk:warning'          // Risk threshold breached
'portfolio:opportunity'           // New opportunities

// Alerts
'alert:triggered:${alertId}'      // Alert fired
'alert:price_target'              // Price targets hit
'alert:earnings_reminder'         // Upcoming earnings

// Social
'community:new_post'              // New community posts
'community:mention'               // User mentioned
'community:follow'                // New follower
```

## Data Pipeline Architecture

### Real-time Data Flow
```
Market Data Sources → Data Ingestion → Processing → Cache → Frontend
     ↓                      ↓              ↓         ↓        ↓
Polygon.io API     → API Gateway → Greeks Calc → Redis → WebSocket
Alpha Vantage      → Rate Limiter → Risk Engine → ClickHouse → React Query
Yahoo Finance      → Transformer  → Alert Engine → PostgreSQL → UI Components
```

### Background Processing
```typescript
// Data ingestion jobs
export const dataJobs = {
  // Market data refresh
  'update-market-data': {
    pattern: '*/5 * * * *',  // Every 5 minutes during market hours
    handler: updateMarketDataJob
  },
  
  // Options chains refresh  
  'update-options-chains': {
    pattern: '*/15 * * * *', // Every 15 minutes
    handler: updateOptionsChainsJob
  },
  
  // News and sentiment analysis
  'analyze-news-sentiment': {
    pattern: '*/10 * * * *', // Every 10 minutes
    handler: analyzeNewsJob
  },
  
  // Generate daily recommendations
  'generate-recommendations': {
    pattern: '0 6 * * MON-FRI', // 6 AM weekdays
    handler: generateRecommendationsJob
  },
  
  // Risk monitoring
  'monitor-portfolio-risk': {
    pattern: '*/30 * * * *', // Every 30 minutes
    handler: monitorRiskJob
  },
  
  // Cleanup expired data
  'cleanup-expired-data': {
    pattern: '0 2 * * *',    // 2 AM daily
    handler: cleanupDataJob
  }
}
```

## Core Algorithms

### Options Pricing Engine
```typescript
// Black-Scholes implementation with dividends
export class OptionsPricingEngine {
  static calculateGreeks(
    spot: number,
    strike: number, 
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    dividendYield: number = 0,
    optionType: 'call' | 'put' = 'call'
  ): {
    price: number
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
  } {
    const d1 = (Math.log(spot/strike) + (riskFreeRate - dividendYield + 0.5 * volatility**2) * timeToExpiry) / 
               (volatility * Math.sqrt(timeToExpiry))
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry)
    
    const nd1 = this.normalCDF(d1)
    const nd2 = this.normalCDF(d2)
    const npd1 = this.normalPDF(d1)
    
    if (optionType === 'call') {
      return {
        price: spot * Math.exp(-dividendYield * timeToExpiry) * nd1 - 
               strike * Math.exp(-riskFreeRate * timeToExpiry) * nd2,
        delta: Math.exp(-dividendYield * timeToExpiry) * nd1,
        gamma: Math.exp(-dividendYield * timeToExpiry) * npd1 / (spot * volatility * Math.sqrt(timeToExpiry)),
        theta: (-spot * npd1 * volatility * Math.exp(-dividendYield * timeToExpiry)) / (2 * Math.sqrt(timeToExpiry)) -
               riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * nd2,
        vega: spot * Math.exp(-dividendYield * timeToExpiry) * npd1 * Math.sqrt(timeToExpiry) / 100,
        rho: strike * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * nd2 / 100
      }
    } else {
      // Put calculations...
      return {
        price: strike * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2) - 
               spot * Math.exp(-dividendYield * timeToExpiry) * this.normalCDF(-d1),
        delta: -Math.exp(-dividendYield * timeToExpiry) * this.normalCDF(-d1),
        gamma: Math.exp(-dividendYield * timeToExpiry) * npd1 / (spot * volatility * Math.sqrt(timeToExpiry)),
        theta: (-spot * npd1 * volatility * Math.exp(-dividendYield * timeToExpiry)) / (2 * Math.sqrt(timeToExpiry)) +
               riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2),
        vega: spot * Math.exp(-dividendYield * timeToExpiry) * npd1 * Math.sqrt(timeToExpiry) / 100,
        rho: -strike * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2) / 100
      }
    }
  }
  
  private static normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }
  
  private static normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  }
  
  private static erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911
    
    const sign = Math.sign(x)
    x = Math.abs(x)
    
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    
    return sign * y
  }
}
```

### Portfolio Risk Calculator
```typescript
export class PortfolioRiskEngine {
  static calculatePortfolioVaR(
    positions: Position[],
    confidence: number = 0.95,
    timeHorizon: number = 1 // days
  ): {
    portfolioVar: number
    componentVars: Array<{symbol: string, var: number}>
    diversificationBenefit: number
  } {
    // Monte Carlo simulation for portfolio VaR
    const simulations = 10000
    const returns: number[] = []
    
    for (let i = 0; i < simulations; i++) {
      let portfolioReturn = 0
      
      positions.forEach(position => {
        // Simulate price movement using GBM
        const randomShock = this.generateNormalRandom()
        const volatility = this.getAssetVolatility(position.symbol)
        const dailyReturn = volatility * randomShock / Math.sqrt(252)
        
        portfolioReturn += (position.marketValue * dailyReturn)
      })
      
      returns.push(portfolioReturn)
    }
    
    // Calculate VaR at specified confidence level
    returns.sort((a, b) => a - b)
    const varIndex = Math.floor((1 - confidence) * simulations)
    const portfolioVar = Math.abs(returns[varIndex])
    
    // Component VaRs
    const componentVars = positions.map(pos => ({
      symbol: pos.symbol,
      var: Math.abs(pos.marketValue * this.getAssetVolatility(pos.symbol) * 2.33 / Math.sqrt(252)) // 99% 1-day VaR
    }))
    
    // Diversification benefit
    const sumComponentVars = componentVars.reduce((sum, comp) => sum + comp.var, 0)
    const diversificationBenefit = sumComponentVars - portfolioVar
    
    return {
      portfolioVar,
      componentVars,
      diversificationBenefit
    }
  }
  
  private static generateNormalRandom(): number {
    // Box-Muller transformation
    let u = 0, v = 0
    while(u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }
  
  private static getAssetVolatility(symbol: string): number {
    // In production: Fetch from database or calculate from historical data
    const mockVolatilities: Record<string, number> = {
      'AAPL': 0.25,
      'NVDA': 0.45,
      'SPY': 0.18,
      'QQQ': 0.22,
      'TSLA': 0.55
    }
    return mockVolatilities[symbol] || 0.30 // Default 30% annual volatility
  }
}
```

### ML Recommendation Engine
```typescript
export class MLRecommendationEngine {
  private model: any // In production: TensorFlow.js or API to Python model
  
  async scoreRecommendation(
    marketData: any,
    technicalIndicators: any,
    fundamentalData: any,
    newsData: any,
    portfolioContext: any
  ): Promise<{
    score: number
    confidence: number
    reasoning: string[]
    riskFactors: string[]
  }> {
    // Feature engineering
    const features = this.extractFeatures(
      marketData,
      technicalIndicators, 
      fundamentalData,
      newsData,
      portfolioContext
    )
    
    // Model prediction
    const prediction = await this.model.predict(features)
    
    // Explainable AI - generate reasoning
    const reasoning = this.explainPrediction(features, prediction)
    
    return {
      score: prediction.score,
      confidence: prediction.confidence,
      reasoning: reasoning.positive,
      riskFactors: reasoning.negative
    }
  }
  
  private extractFeatures(marketData: any, technical: any, fundamental: any, news: any, portfolio: any) {
    return {
      // Technical features
      rsi: technical.rsi,
      macd: technical.macd,
      volumeRatio: marketData.volume / marketData.avgVolume,
      priceVsMA: marketData.price / technical.sma20,
      
      // Fundamental features
      peRatio: fundamental.peRatio,
      revenueGrowth: fundamental.revenueGrowth,
      earningsGrowth: fundamental.earningsGrowth,
      
      // News sentiment
      sentimentScore: news.sentimentScore,
      newsVolume: news.articleCount,
      
      // Portfolio context
      portfolioCorrelation: portfolio.correlation,
      riskBudgetUtilization: portfolio.riskUtilization,
      sectorExposure: portfolio.sectorExposure
    }
  }
}
```

## Performance & Scalability

### Caching Strategy
```typescript
// Multi-layer caching
export const CACHE_CONFIG = {
  // Browser cache (React Query)
  browser: {
    staleTime: 30000,      // 30 seconds
    cacheTime: 300000      // 5 minutes
  },
  
  // Edge cache (Vercel)
  edge: {
    'market-data': 30,     // 30 seconds
    'static-content': 3600, // 1 hour
    'user-preferences': 300 // 5 minutes
  },
  
  // Redis cache
  redis: {
    'options-chains': 60,   // 1 minute
    'recommendations': 1800, // 30 minutes  
    'portfolio-data': 300,  // 5 minutes
    'user-sessions': 86400  // 24 hours
  },
  
  // Database query cache
  database: {
    'historical-data': 3600, // 1 hour
    'company-info': 86400,   // 24 hours
    'user-settings': 1800    // 30 minutes
  }
}
```

### Rate Limiting
```typescript
export const RATE_LIMITS = {
  // By subscription tier
  free: {
    'api-calls': { requests: 100, window: '1h' },
    'recommendations': { requests: 3, window: '1d' },
    'scans': { requests: 5, window: '1d' }
  },
  
  pro: {
    'api-calls': { requests: 1000, window: '1h' },
    'recommendations': { requests: 25, window: '1d' }, 
    'scans': { requests: -1, window: '1d' } // unlimited
  },
  
  elite: {
    'api-calls': { requests: 10000, window: '1h' },
    'recommendations': { requests: -1, window: '1d' },
    'scans': { requests: -1, window: '1d' }
  },
  
  // Global limits (DDoS protection)
  global: {
    'signup': { requests: 5, window: '15m' },
    'password-reset': { requests: 3, window: '1h' },
    'api-auth': { requests: 20, window: '5m' }
  }
}
```

### Database Optimization
```sql
-- Key indexes for performance
CREATE INDEX CONCURRENTLY idx_options_chains_lookup 
ON option_chains (symbol, expiration_date, option_type);

CREATE INDEX CONCURRENTLY idx_recommendations_user_recent
ON recommendations (user_id, created_at DESC) WHERE expires_at > NOW();

CREATE INDEX CONCURRENTLY idx_positions_portfolio_symbol
ON positions (portfolio_id, symbol);

CREATE INDEX CONCURRENTLY idx_compliance_logs_user_action
ON compliance_logs (user_id, action_type, created_at);

-- Partitioning for large tables
CREATE TABLE historical_prices_2024 PARTITION OF historical_prices
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Materialized views for analytics
CREATE MATERIALIZED VIEW daily_user_metrics AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as recommendations_viewed,
  COUNT(DISTINCT symbol) as symbols_analyzed
FROM recommendations 
GROUP BY user_id, DATE(created_at);
```

## Security Implementation

### Authentication Flow
```typescript
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      authorize: async (credentials) => {
        // Verify credentials with bcrypt
        const user = await verifyCredentials(credentials)
        return user ? { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          subscriptionTier: user.subscriptionTier
        } : null
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.subscriptionTier = user.subscriptionTier
        token.userId = user.id
      }
      return token
    },
    
    session: async ({ session, token }) => {
      session.user.id = token.userId
      session.user.subscriptionTier = token.subscriptionTier
      return session
    }
  }
}
```

### API Security
```typescript
// Middleware for API protection
export async function authMiddleware(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  // Rate limiting check
  const rateLimitResult = await checkRateLimit(
    session.user.id,
    session.user.subscriptionTier,
    req.nextUrl.pathname
  )
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        resetTime: rateLimitResult.resetTime
      },
      { status: 429 }
    )
  }
  
  // Add user context to request
  req.user = session.user
  return NextResponse.next()
}

// Input validation
export const validateApiInput = (schema: z.ZodSchema) => {
  return (handler: Function) => {
    return async (req: NextRequest) => {
      try {
        const body = await req.json()
        const validatedInput = schema.parse(body)
        return handler(req, validatedInput)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        throw error
      }
    }
  }
}
```

## Deployment & DevOps

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test
      - run: npm run type-check
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Environment Configuration
```typescript
// Production environment variables
const requiredEnvVars = {
  // Database
  DATABASE_URL: 'PostgreSQL connection string',
  REDIS_URL: 'Redis connection string',
  
  // Authentication  
  NEXTAUTH_SECRET: 'JWT signing secret',
  NEXTAUTH_URL: 'https://refract.trade',
  
  // External APIs
  POLYGON_API_KEY: 'Market data API key',
  OPENAI_API_KEY: 'AI analysis API key',
  STRIPE_SECRET_KEY: 'Payment processing',
  
  // Monitoring
  SENTRY_DSN: 'Error tracking',
  DATADOG_API_KEY: 'Infrastructure monitoring'
}
```

### Monitoring & Alerting
```typescript
// Critical metrics to monitor
export const MONITORING_CONFIG = {
  // Application performance
  responseTime: { threshold: 500, severity: 'warning' },
  errorRate: { threshold: 0.01, severity: 'critical' },
  availability: { threshold: 0.999, severity: 'critical' },
  
  // Business metrics
  signupRate: { threshold: 10, severity: 'info' },
  conversionRate: { threshold: 0.12, severity: 'warning' },
  churnRate: { threshold: 0.05, severity: 'warning' },
  
  // Infrastructure
  cpuUsage: { threshold: 80, severity: 'warning' },
  memoryUsage: { threshold: 85, severity: 'warning' },
  diskSpace: { threshold: 90, severity: 'critical' },
  
  // External dependencies
  apiLatency: { threshold: 1000, severity: 'warning' },
  apiErrorRate: { threshold: 0.05, severity: 'critical' }
}
```

This technical specification provides the foundation for building a scalable, secure, and compliant options trading SaaS platform capable of reaching $100M+ ARR.