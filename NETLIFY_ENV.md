# Netlify Environment Variables Setup

This document lists all environment variables that need to be configured in your Netlify dashboard for the Refract.trade application to work properly in production.

## ⚠️ IMPORTANT: Database Variables Must Be Set First!

**The build will FAIL if DATABASE_URL is not configured before deployment.** Prisma needs this to generate the client during the build process.

## Required Environment Variables

### Database & Authentication (CRITICAL - These must be set first!)
```
DATABASE_URL=postgresql://postgres.pfeikjkqqotksxwijcwh:FUsFtNdYPK8n5LA4@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.pfeikjkqqotksxwijcwh:FUsFtNdYPK8n5LA4@aws-0-us-east-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://pfeikjkqqotksxwijcwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWlramtxcW90a3N4d2lqY3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjY5ODksImV4cCI6MjA4NjI0Mjk4OX0.lvT1NGzFjmdMixFv3HY7dKKSakqWtL60q-3fQN4P2kg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWlramtxcW90a3N4d2lqY3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2Njk4OSwiZXhwIjoyMDg2MjQyOTg5fQ.n4cv1s6tqumaLEOOJ2tg7eyowzkjx9TfoNpSrSlAW3s
```

### NextAuth Configuration
```
NEXTAUTH_SECRET=refract-trade-super-secret-key-2024
NEXTAUTH_URL=https://your-netlify-site-name.netlify.app
```

### Market Data APIs (NEW - Required for market data integration)
```
NEXT_PUBLIC_MARKET_DATA_PROVIDER=alpha_vantage
NEXT_PUBLIC_ENABLE_REAL_DATA=true
ALPHA_VANTAGE_API_KEY=demo
```

## How to Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Click on your site
3. Go to Site settings
4. Click on "Environment variables" in the left sidebar
5. Click "Add variable" for each environment variable listed above
6. Enter the Key and Value exactly as shown
7. Save the variables
8. Redeploy your site (or trigger a new build)

## Optional API Keys (for better rate limits)

If you have API keys for these services, you can add them for better performance:

```
FINNHUB_API_KEY=your_finnhub_api_key_here
IEX_API_KEY=your_iex_api_key_here
POLYGON_API_KEY=your_polygon_api_key_here
INTRINIO_API_KEY=your_intrinio_api_key_here
```

## 🚀 Deployment Checklist

**Before triggering a Netlify build, ensure you have:**

1. ✅ Set `DATABASE_URL` and `DIRECT_URL` in Netlify environment variables
2. ✅ Set all Supabase environment variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.)
3. ✅ Set NextAuth variables (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
4. ✅ Set market data variables (`NEXT_PUBLIC_MARKET_DATA_PROVIDER`, etc.)
5. ✅ **Trigger a manual deploy** after setting environment variables

## Troubleshooting Build Issues

If you see "PrismaClientInitializationError" during build:

1. **Check DATABASE_URL**: Ensure it's set correctly in Netlify environment variables
2. **Clear Build Cache**: In Netlify dashboard, go to Site settings → Build & deploy → Build settings → Clear cache and retry
3. **Redeploy**: Trigger a fresh deployment after clearing cache

## Notes

- The `demo` value for `ALPHA_VANTAGE_API_KEY` provides limited functionality
- Yahoo Finance provider doesn't require an API key and serves as a fallback
- At least one market data provider will always be available (Yahoo Finance)
- The system will gracefully fall back to mock data if all real providers fail