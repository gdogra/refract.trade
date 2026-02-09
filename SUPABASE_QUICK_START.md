# 🚀 Supabase Quick Start for Refract.trade

Since we have your actual credentials, let's get the database set up quickly.

## 🔥 Immediate Setup (5 minutes)

### 1. Set Up Database Tables
**Open this link in a new tab**: https://supabase.com/dashboard/project/pfeikjkqqotksxwijcwh/sql/new

Copy and paste this SQL into the editor, then click **RUN**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  avatar TEXT,
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'elite')),
  subscription_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  risk_tolerance TEXT DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  trading_goals TEXT[] DEFAULT '{}',
  dashboard_layout JSONB,
  notification_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table  
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL,
  entry_price DECIMAL(10,4) NOT NULL,
  exit_price DECIMAL(10,4),
  unrealized_pnl DECIMAL(15,2),
  realized_pnl DECIMAL(15,2),
  delta DECIMAL(8,6),
  gamma DECIMAL(8,6),
  theta DECIMAL(8,6),
  vega DECIMAL(8,6),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk alerts table
CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('position_risk', 'portfolio_risk', 'market_event')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_risk_alerts_user_id ON risk_alerts(user_id);
```

### 2. Your Environment Variables
Your `.env.local` file has been created with your actual credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://pfeikjkqqotksxwijcwh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWlramtxcW90a3N4d2lqY3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjY5ODksImV4cCI6MjA4NjI0Mjk4OX0.lvT1NGzFjmdMixFv3HY7dKKSakqWtL60q-3fQN4P2kg"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWlramtxcW90a3N4d2lqY3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2Njk4OSwiZXhwIjoyMDg2MjQyOTg5fQ.n4cv1s6tqumaLEOOJ2tg7eyowzkjx9TfoNpSrSlAW3s"
```

**⚠️ You still need to add your database password to DATABASE_URL in .env.local**

### 3. Start Development
```bash
npx prisma generate
npm run dev
```

### 4. Test the App
1. Go to: http://localhost:3000
2. Click "Sign Up" 
3. Create a test account
4. Check your Supabase dashboard → Table Editor → users

## 🎯 What's Working Now

After running the SQL above, you'll have:

- ✅ **User registration and login**
- ✅ **Secure authentication with NextAuth.js** 
- ✅ **Database integration with Supabase**
- ✅ **Basic portfolio tracking structure**
- ✅ **Risk alerts system ready**
- ✅ **Professional landing page**

## 🔧 Troubleshooting

**If signup fails:**
1. Check Supabase → Table Editor → users to see if the table exists
2. Make sure the SQL ran without errors
3. Verify your .env.local has the correct database password

**To get your database password:**
1. Go to: https://supabase.com/dashboard/project/pfeikjkqqotksxwijcwh/settings/database
2. Find the "Connection string" section
3. Copy the password from there

## 🚀 Next Development Steps

With the basic setup complete, you can now start building:

1. **Dashboard UI** - Portfolio overview and risk metrics
2. **Options Chain** - Live market data integration
3. **Risk Visualization** - Interactive charts and heat maps
4. **AI Recommendations** - Strategy suggestions
5. **Real-time Alerts** - WebSocket notifications

The foundation is solid and ready for rapid feature development! 🎉