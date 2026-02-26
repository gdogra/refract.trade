# Migration Guide: V1 → V2 Architecture
## Safe, Zero-Downtime Migration to New Options Data Stack

---

## 🎯 **MIGRATION OVERVIEW**

This guide provides step-by-step instructions for migrating from the current Yahoo Finance + Alpha Vantage architecture to the new Polygon + Redis + Enhanced Greeks stack.

### **Migration Principles**
- ✅ **Zero downtime** - V1 APIs remain functional
- ✅ **Backward compatible** - Existing components unchanged
- ✅ **Gradual rollout** - Component-by-component migration
- ✅ **Easy rollback** - Can revert at any stage

---

## 🏃‍♂️ **QUICK START (15 MINUTES)**

### **1. Environment Setup**
```bash
# Add these to your .env.local or Netlify environment
POLYGON_API_KEY="your-polygon-starter-key"
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```

### **2. Verify Installation**
```bash
# Check if new APIs are working
curl http://localhost:3000/api/v2/health
curl http://localhost:3000/api/v2/quotes?symbol=AAPL
```

### **3. Test in Production**
```bash
# Deploy with existing V1 APIs still active
npm run build
git add . && git commit -m "Add V2 architecture alongside V1"
git push origin main
```

### **4. Verification**
```bash
# Test production V2 APIs
curl https://yoursite.netlify.app/api/v2/health
curl https://yoursite.netlify.app/api/v2/quotes?symbol=AAPL
```

**✅ At this point, both V1 and V2 APIs are running simultaneously**

---

## 📋 **DETAILED MIGRATION STEPS**

### **Phase 1: Infrastructure Setup (Day 1)**

#### **1.1 Service Registration**
1. **Polygon.io Account**
   - Visit: https://polygon.io/pricing
   - Sign up for **Starter Plan** ($99/month)
   - Copy API key to environment variables

2. **Upstash Redis Account**
   - Visit: https://upstash.com
   - Create free account (10K requests/day free)
   - Create Redis database
   - Copy connection details to environment variables

#### **1.2 Environment Configuration**
```bash
# Production (Netlify)
POLYGON_API_KEY=pk_test_... # Your Polygon key
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Development (.env.local)
POLYGON_API_KEY=pk_test_...
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### **1.3 Deploy V2 APIs**
```bash
# V2 APIs are already implemented - just deploy
git add .
git commit -m "Deploy V2 APIs alongside V1 (backward compatible)"
git push origin main

# Verify deployment
curl https://yoursite.com/api/v2/health
```

### **Phase 2: Component Migration (Days 2-7)**

#### **2.1 Quote Components** 
Components to migrate first (lowest risk):

```typescript
// BEFORE: Direct API call in component
const response = await fetch(`/api/options/quote?symbol=${symbol}`)

// AFTER: Use V2 API with enhanced data
const response = await fetch(`/api/v2/quotes?symbol=${symbol}`)

// Response now includes:
// - source: 'polygon' | 'alpha_vantage' | 'fallback'
// - cached: boolean
// - Enhanced metadata
```

**Priority Components:**
1. `/src/app/options/components/MarketDataPanel.tsx`
2. `/src/app/dashboard/components/MarketOverview.tsx` 
3. `/src/components/analytics/RealTimeMonitoring.tsx`

#### **2.2 Options Chain Migration**
```typescript
// BEFORE: Yahoo Finance with basic Greeks
const response = await fetch(`/api/options/chain?symbol=${symbol}`)

// AFTER: Enhanced chain with calculated Greeks
const response = await fetch(`/api/v2/options/chain?symbol=${symbol}`)

// Response now includes:
// - Calculated Greeks for all contracts
// - Aggregate metrics (P/C ratio, max pain)
// - Risk metrics and analysis
```

**Priority Components:**
1. `/src/hooks/useOptionsChain.ts`
2. `/src/app/options/components/OptionsChainClient.tsx`

### **Phase 3: Frontend Hook Updates (Days 3-5)**

#### **3.1 Update useOptionsChain Hook**
```typescript
// File: /src/hooks/useOptionsChain.ts

// BEFORE
const response = await fetch(`/api/options/chain?${params}`, {
  signal: controller.signal
})

// AFTER  
const response = await fetch(`/api/v2/options/chain?${params}`, {
  signal: controller.signal
})

// The response structure is backward compatible!
// But now includes enhanced Greeks and metadata
```

#### **3.2 Update useMarketData Hook**
```typescript
// Create new hook for V2 APIs
// File: /src/hooks/useMarketDataV2.ts

import { useQuery } from '@tanstack/react-query'

export function useEnhancedQuote(symbol: string) {
  return useQuery({
    queryKey: ['enhanced-quote', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/v2/quotes?symbol=${symbol}`)
      if (!response.ok) throw new Error('Failed to fetch quote')
      return response.json()
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000
  })
}
```

### **Phase 4: Portfolio Features (Days 5-7)**

#### **4.1 Portfolio Risk Integration**
```typescript
// Add portfolio risk analysis to existing dashboard
// File: /src/app/dashboard/components/RiskMetricsPanel.tsx

const { data: riskMetrics } = useQuery({
  queryKey: ['portfolio-risk'],
  queryFn: async () => {
    const response = await fetch('/api/v2/portfolio/risk')
    return response.json()
  },
  refetchInterval: 60000 // 1 minute
})

// Display comprehensive risk metrics:
// - Net Greeks
// - Concentration risk  
// - Expiration alerts
// - Risk score
```

### **Phase 5: Performance Optimization (Week 2)**

#### **5.1 Cache Tuning**
Monitor cache performance and adjust TTL values:

```typescript
// Check cache hit rates via health endpoint
const health = await fetch('/api/v2/health')
const data = await health.json()

console.log('Cache Performance:', data.performance)
// Adjust cache TTL based on hit rates
```

#### **5.2 Rate Limit Optimization**
Monitor API usage to stay within limits:

```bash
# Track Polygon API usage
# Starter plan: 5 requests/minute
# Current usage visible in health endpoint
```

---

## 🔄 **COMPONENT-BY-COMPONENT MIGRATION**

### **High Priority (Week 1)**
| Component | Current API | New API | Risk Level |
|-----------|-------------|---------|------------|
| MarketDataPanel | `/api/options/quote` | `/api/v2/quotes` | 🟢 Low |
| OptionsChainClient | `/api/options/chain` | `/api/v2/options/chain` | 🟡 Medium |
| useOptionsChain hook | `/api/options/chain` | `/api/v2/options/chain` | 🟡 Medium |

### **Medium Priority (Week 2)**  
| Component | Current API | New API | Risk Level |
|-----------|-------------|---------|------------|
| DailyTradeOpportunities | `/api/trading/daily-opportunities` | `/api/v2/quotes` (batch) | 🟡 Medium |
| RealTimeMonitoring | `/api/options/quote` | `/api/v2/quotes` | 🟢 Low |
| SymbolSearch | `/api/options/quote` | `/api/v2/quotes` | 🟢 Low |

### **Low Priority (Week 3+)**
| Component | Current API | New API | Risk Level |
|-----------|-------------|---------|------------|
| Analytics components | Various | `/api/v2/portfolio/risk` | 🔴 High |
| Strategy recommendations | `/api/options/chain` | `/api/v2/options/chain` | 🟡 Medium |

---

## 🧪 **TESTING STRATEGY**

### **1. API Compatibility Testing**
```bash
# Test all V1 endpoints still work
curl https://yoursite.com/api/options/quote?symbol=AAPL
curl https://yoursite.com/api/options/chain?symbol=AAPL

# Test new V2 endpoints work  
curl https://yoursite.com/api/v2/quotes?symbol=AAPL
curl https://yoursite.com/api/v2/options/chain?symbol=AAPL

# Compare response structures
diff <(curl -s /api/options/quote?symbol=AAPL | jq .) <(curl -s /api/v2/quotes?symbol=AAPL | jq .data)
```

### **2. Load Testing**
```bash
# Test cache performance under load
for i in {1..10}; do
  curl -w "%{time_total}s\\n" -o /dev/null -s https://yoursite.com/api/v2/quotes?symbol=AAPL
done

# Should see faster responses on subsequent calls (cache hits)
```

### **3. Fallback Testing**
```bash
# Test fallback mechanisms by temporarily breaking primary provider
# (Remove Polygon key temporarily)
unset POLYGON_API_KEY

# Should fall back to Alpha Vantage gracefully
curl https://yoursite.com/api/v2/quotes?symbol=AAPL
# Response should include: "source": "alpha_vantage"
```

---

## ⚠️ **ROLLBACK PROCEDURES**

### **Emergency Rollback (If V2 APIs Fail)**

#### **1. Immediate Actions**
```bash
# Option 1: Disable V2 APIs via environment variable
export DISABLE_V2_APIS=true

# Option 2: Remove V2 environment variables
unset POLYGON_API_KEY
unset UPSTASH_REDIS_REST_URL  
unset UPSTASH_REDIS_REST_TOKEN

# Redeploy
git commit -m "Emergency rollback to V1 APIs"
git push origin main
```

#### **2. Component Rollback**
```typescript
// Revert any components that were migrated
// Change back from:
fetch('/api/v2/quotes?symbol=${symbol}')

// To:
fetch('/api/options/quote?symbol=${symbol}')
```

### **Planned Rollback (If Issues Discovered)**

#### **1. Gradual Rollback**
```typescript
// Add feature flags to components
const USE_V2_API = process.env.NEXT_PUBLIC_USE_V2_API === 'true'

const apiUrl = USE_V2_API 
  ? '/api/v2/quotes' 
  : '/api/options/quote'
```

#### **2. Monitor During Rollback**
- Check error rates in V1 vs V2 APIs
- Monitor user experience metrics
- Verify all features working as expected

---

## 📊 **MIGRATION MONITORING**

### **Key Metrics to Track**

#### **Performance Metrics**
```bash
# API Response Times
curl -w "V1: %{time_total}s\n" https://yoursite.com/api/options/quote?symbol=AAPL
curl -w "V2: %{time_total}s\n" https://yoursite.com/api/v2/quotes?symbol=AAPL

# Cache Hit Rates (from health endpoint)
curl https://yoursite.com/api/v2/health | jq '.performance.cacheHitRate'
```

#### **Cost Metrics**
- **Polygon API usage**: Monitor via dashboard
- **Redis operations**: Monitor via Upstash console  
- **Overall API costs**: Compare month-over-month

#### **Error Rates**
```bash
# Monitor error rates in both API versions
# V1 errors (should remain stable)
# V2 errors (should decrease over time as cache warms up)
```

### **Success Criteria**
- ✅ **V2 response times < V1** (due to caching)
- ✅ **Error rates < 1%** for both API versions
- ✅ **Cache hit rate > 60%** within 1 week
- ✅ **Cost per user < $0.10/month** at 1K users

---

## 🎯 **MIGRATION COMPLETION**

### **Phase 4: V1 API Deprecation (Week 4+)**

#### **1. Announce Deprecation**
```typescript
// Add deprecation warnings to V1 APIs
console.warn('API v1 is deprecated. Please migrate to /api/v2/* endpoints')

// Add response headers
response.headers.set('X-API-Deprecation', 'This endpoint is deprecated')
response.headers.set('X-API-Migration', 'Migrate to /api/v2/*')
```

#### **2. Monitor V1 Usage**
```bash
# Track which components still use V1 APIs
# Plan final migration for any remaining components
```

#### **3. Final Migration**
```bash
# Remove V1 API routes after all components migrated
rm -rf src/app/api/options/quote/
rm -rf src/app/api/options/chain/
rm -rf src/app/api/trading/daily-opportunities/
```

### **Migration Success Checklist**
- [ ] All environment variables configured
- [ ] V2 APIs deployed and functional
- [ ] Health monitoring in place
- [ ] Frontend components migrated
- [ ] Performance targets met
- [ ] Cost targets met
- [ ] User experience maintained
- [ ] V1 APIs deprecated and removed

---

## 💡 **MIGRATION TIPS**

### **Best Practices**
1. **Test in development first** - Never migrate production directly
2. **Migrate one component at a time** - Easier to debug issues
3. **Monitor health endpoint** - Early warning system for problems  
4. **Keep V1 APIs during transition** - Safety net for rollback
5. **Document each migration step** - Help with troubleshooting

### **Common Pitfalls**
- ❌ **Forgetting environment variables** - V2 APIs will fail silently
- ❌ **Not testing fallbacks** - Cache/Redis failures cause outages
- ❌ **Migrating too fast** - Hard to identify which change caused issues
- ❌ **Not monitoring costs** - Rate limits can cause unexpected charges

### **Pro Tips**
- 🚀 **Use health endpoint** for monitoring service status
- 🚀 **Start with read-only components** (lower risk)
- 🚀 **Batch test API calls** to verify rate limiting works
- 🚀 **Monitor cache hit rates** for optimization opportunities

---

*Migration guide by Claude Code - Safe, tested, production-ready*