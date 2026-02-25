# Netlify Environment Variables Setup

The production deployment requires the following environment variables to be set in the Netlify dashboard:

## Required Environment Variables

### Database (Supabase)
```
DATABASE_URL="postgresql://postgres.pfeikjkqqotksxwijcwh:FUsFtNdYPK8n5LA4@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.pfeikjkqqotksxwijcwh:FUsFtNdYPK8n5LA4@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Supabase API
```
NEXT_PUBLIC_SUPABASE_URL="https://pfeikjkqqotksxwijcwh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[from Supabase dashboard]"
SUPABASE_SERVICE_ROLE_KEY="[from Supabase dashboard]"
```

### Authentication
```
NEXTAUTH_SECRET="[random secure string]"
NEXTAUTH_URL="https://refracttrade.netlify.app"
```

### Google OAuth
```
GOOGLE_CLIENT_ID="[from Google Cloud Console]"
GOOGLE_CLIENT_SECRET="[from Google Cloud Console]"
```

### Market Data APIs
```
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY="[from Alpha Vantage - free tier allows 25 requests/day]"
```

## Current API Failures

1. **502 Bad Gateway on `/api/trading/daily-opportunities/`** - Missing Alpha Vantage API key
2. **500 Internal Server Error on `/api/feedback/`** - Database connection issue

## Steps to Fix:

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add all the above environment variables
3. Redeploy the site
4. Test the APIs:
   - `/api/trading/daily-opportunities/` 
   - `/api/feedback/`
   - `/api/options/quote?symbol=AAPL`

## Testing Commands:
```bash
# Test quote API
curl "https://refracttrade.netlify.app/api/options/quote?symbol=AAPL"

# Test daily opportunities
curl "https://refracttrade.netlify.app/api/trading/daily-opportunities"
```