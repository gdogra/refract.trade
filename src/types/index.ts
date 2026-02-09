// Core application types

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  subscriptionTier: 'basic' | 'pro' | 'elite'
  subscriptionExpiry?: Date
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  userId: string
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  tradingGoals: string[]
  dashboardLayout?: any
  notificationSettings?: any
  tradingHours?: any
}

export interface Account {
  id: string
  userId: string
  broker: string
  accountNumber: string
  accountType: 'margin' | 'cash' | 'ira'
  isActive: boolean
  cashBalance: number
  buyingPower: number
  totalValue: number
}

export interface Position {
  id: string
  userId: string
  accountId: string
  symbol: string
  strategyType: string
  quantity: number
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  unrealizedPnl?: number
  realizedPnl?: number
  delta?: number
  gamma?: number
  theta?: number
  vega?: number
  legs: PositionLeg[]
  aiScore?: number
  aiNotes?: string
  isActive: boolean
}

export interface PositionLeg {
  id: string
  positionId: string
  symbol: string
  optionType: 'call' | 'put'
  strike: number
  expiry: Date
  quantity: number
  side: 'buy' | 'sell'
  entryPrice: number
  exitPrice?: number
  delta?: number
  gamma?: number
  theta?: number
  vega?: number
  iv?: number
}

export interface OptionContract {
  symbol: string
  expiry: Date
  strike: number
  optionType: 'call' | 'put'
  bid?: number
  ask?: number
  lastPrice?: number
  volume?: number
  openInterest?: number
  delta?: number
  gamma?: number
  theta?: number
  vega?: number
  rho?: number
  impliedVolatility?: number
  timestamp: Date
}

export interface Strategy {
  id: string
  userId: string
  name: string
  description?: string
  strategyType: string
  parameters: any
  backtestData?: any
  successRate?: number
  avgReturn?: number
  maxDrawdown?: number
  sharpeRatio?: number
  aiScore?: number
  isPublic: boolean
  isActive: boolean
}

export interface RiskMetrics {
  totalDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
  var95?: number
  var99?: number
  stressTests: StressTestResult[]
}

export interface StressTestResult {
  scenario: string
  pnlChange: number
  probability: number
}

export interface RiskAlert {
  id: string
  userId: string
  alertType: 'position_risk' | 'portfolio_risk' | 'market_event'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  data?: any
  isRead: boolean
  isResolved: boolean
  createdAt: Date
}

export interface TaxRecord {
  id: string
  userId: string
  year: number
  symbol: string
  quantity: number
  costBasis: number
  dateAcquired: Date
  dateSold?: Date
  salePrice?: number
  isShortTerm?: boolean
  isWashSale: boolean
  harvestable: boolean
}

export interface WashSale {
  id: string
  userId: string
  symbol: string
  lossDate: Date
  lossAmount: number
  washPeriodEnd: Date
  isActive: boolean
}

export interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume?: number
  beta?: number
  marketCap?: number
  timestamp: Date
}

export interface AIRecommendation {
  type: 'strategy' | 'adjustment' | 'exit'
  confidence: number
  reasoning: string
  action: string
  parameters?: any
  expectedOutcome: {
    probabilityOfProfit: number
    expectedReturn: number
    maxRisk: number
  }
}

export interface LearningModule {
  id: string
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  topics: string[]
  prerequisites: string[]
}

export interface LearningProgress {
  id: string
  userId: string
  moduleId: string
  moduleName: string
  progress: number
  completed: boolean
  score?: number
  weaknesses: string[]
  strengths: string[]
  lastAccessed?: Date
  completedAt?: Date
}

export interface CommunityProfile {
  id: string
  userId: string
  username: string
  bio?: string
  successRate?: number
  avgReturn?: number
  riskAdjReturn?: number
  totalTrades: number
  reputation: number
  contributions: number
  sharePerformance: boolean
  shareStrategies: boolean
}

// UI and component types
export interface DashboardWidget {
  id: string
  type: string
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config?: any
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  riskAlerts: boolean
  marketNews: boolean
  strategyUpdates: boolean
  taxReminders: boolean
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Market regime types
export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'volatile'

export interface MarketRegimeData {
  regime: MarketRegime
  confidence: number
  duration: number // days in current regime
  indicators: {
    vix: number
    trend: number
    volatility: number
    momentum: number
  }
}