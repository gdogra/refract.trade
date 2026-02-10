# 🚀 Deploy Refract.trade to Vercel

Quick guide to get your app live in production immediately.

## 🔥 One-Click Deploy

### Option 1: Deploy Button (Fastest)
Click this button to deploy directly to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgdogra%2FRefract.trade&env=DATABASE_URL,DIRECT_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXTAUTH_SECRET&envDescription=Supabase%20and%20NextAuth%20configuration&envLink=https%3A%2F%2Fgithub.com%2Fgdogra%2FRefract.trade%2Fblob%2Fmain%2F.env.example)

### Option 2: Manual Vercel Setup

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy from this directory**:
```bash
vercel --prod
```

3. **Follow prompts** and it will deploy automatically

## 🔧 Environment Variables for Vercel

Add these exact values in your Vercel dashboard:

### Database Configuration
```
DATABASE_URL=postgresql://postgres.pfeikjkqqotksxwijcwh:FUsFtNdYPK8n5LA4@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.pfeikjkqqotksxwijcwh:FUsFtNdYPK8n5LA4@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://pfeikjkqqotksxwijcwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-key-here
```

### Authentication Configuration  
```
NEXTAUTH_SECRET=your-super-secret-production-key-here
NEXTAUTH_URL=https://your-vercel-app-url.vercel.app
```

## 📋 Pre-Deployment Checklist

### 1. Set Up Database Tables
**IMPORTANT**: Before deploying, run this SQL in Supabase:

Go to: https://supabase.com/dashboard/project/pfeikjkqqotksxwijcwh/sql/new

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  avatar TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  subscription_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  risk_tolerance TEXT DEFAULT 'moderate',
  experience_level TEXT DEFAULT 'beginner',
  trading_goals TEXT[] DEFAULT '{}',
  dashboard_layout JSONB,
  notification_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can view own user_profile" ON user_profiles FOR ALL USING (auth.uid()::text = user_id::text);
```

### 2. Update Supabase Auth Settings
1. Go to: https://supabase.com/dashboard/project/pfeikjkqqotksxwijcwh/auth/url-configuration
2. Add your Vercel domain to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

## ⚡ Quick Deploy Commands

From your project directory:

```bash
# Generate Prisma client for production
npx prisma generate

# Build the application 
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy with environment variables
vercel --prod --env DATABASE_URL="postgresql://postgres.pfeikjkqqotksxwijcwh:FUsFtNdYPK8n5LA4@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

## 🧪 Testing Production Deployment

Once deployed, test these features:

1. **✅ Landing Page**: Verify it loads and looks good
2. **✅ User Registration**: Create a new account
3. **✅ User Login**: Sign in with created account
4. **✅ Database Connection**: Check user appears in Supabase
5. **✅ Authentication Flow**: Verify redirect to dashboard

## 🛠️ Troubleshooting

### Build Fails
```bash
# Check for TypeScript errors
npm run type-check

# Fix any linting issues
npm run lint
```

### Database Connection Issues
- Verify environment variables in Vercel dashboard
- Check Supabase connection pooling settings
- Ensure database tables exist

### Authentication Issues
- Verify NEXTAUTH_URL matches your Vercel domain
- Check Supabase auth redirect URLs
- Ensure NEXTAUTH_SECRET is set in production

## 🔄 Continuous Deployment

Once connected to Vercel:
- **Auto-deploy**: Every push to main branch
- **Preview deployments**: For pull requests
- **Environment sync**: Production variables managed in Vercel dashboard

## 📊 Performance Monitoring

After deployment, monitor:
- **Vercel Analytics**: Built-in performance tracking
- **Supabase Metrics**: Database performance and usage
- **Core Web Vitals**: Lighthouse scores in production

Your app will be live at `https://your-app-name.vercel.app` within 2-3 minutes! 🚀