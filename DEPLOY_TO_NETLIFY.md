# 🚀 Deploy Refract.trade to Netlify

Complete guide to deploy your next-generation options trading platform to Netlify.

## 🔥 Quick Deploy

### Option 1: Deploy Button (Fastest)
Click this button to deploy directly to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/gdogra/refract.trade)

### Option 2: Manual Netlify Setup

1. **Connect Repository**:
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Choose GitHub and select `gdogra/refract.trade`

2. **Build Settings**:
   ```
   Build command: npm run build
   Publish directory: .next
   ```

3. **Install Next.js Plugin**:
   - Go to "Plugins" in your site dashboard
   - Install "@netlify/plugin-nextjs"
   - Or it will auto-install from netlify.toml

## 🔧 Environment Variables for Netlify

Add these exact values in your Netlify dashboard under **Site settings → Environment variables**:

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
NEXTAUTH_SECRET=refract-trade-super-secret-key-2024-production
NEXTAUTH_URL=https://your-netlify-site.netlify.app
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
2. Add your Netlify domain to:
   - **Site URL**: `https://your-site.netlify.app`
   - **Redirect URLs**: `https://your-site.netlify.app/**`

## ⚡ Quick Deploy Commands

From your project directory:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from this directory
netlify deploy --prod --dir=.next

# Or link to existing site
netlify link
netlify deploy --prod
```

## 🧪 Testing Production Deployment

Once deployed, test these features:

1. **✅ Landing Page**: Verify it loads and looks good
2. **✅ User Registration**: Create a new account
3. **✅ User Login**: Sign in with created account
4. **✅ Dashboard Access**: Verify redirect to dashboard works
5. **✅ Options Chain**: Test symbol search and options data
6. **✅ Strategy Builder**: Try building an options strategy
7. **✅ Database Connection**: Check user appears in Supabase
8. **✅ Mobile Responsive**: Test on phone/tablet

## 🛠️ Troubleshooting

### Build Fails
```bash
# Check for TypeScript errors locally
npm run build

# Check for linting issues
npm run lint
```

### Function Errors
- Verify all environment variables are set in Netlify dashboard
- Check Netlify function logs in dashboard
- Ensure @netlify/plugin-nextjs is installed

### Database Connection Issues
- Verify environment variables in Netlify dashboard
- Check Supabase connection pooling settings
- Ensure database tables exist (run SQL above)

### Authentication Issues
- Verify NEXTAUTH_URL matches your Netlify domain (e.g., https://amazing-app-123.netlify.app)
- Check Supabase auth redirect URLs include your Netlify domain
- Ensure NEXTAUTH_SECRET is set and unique for production

## 🔄 Continuous Deployment

Once connected to Netlify:
- **Auto-deploy**: Every push to main branch
- **Preview deployments**: For pull requests
- **Environment sync**: Production variables managed in Netlify dashboard
- **Build notifications**: Get notified of successful/failed builds

## 📊 Performance Monitoring

After deployment, monitor:
- **Netlify Analytics**: Built-in performance tracking
- **Supabase Metrics**: Database performance and usage
- **Core Web Vitals**: Lighthouse scores in production
- **Function logs**: Monitor API performance

## 🎯 Netlify-Specific Features

Take advantage of:
- **Edge Functions**: For ultra-fast API responses
- **Form Handling**: Built-in form submissions
- **Split Testing**: A/B test different features
- **Branch Deploys**: Test features before main deploy

Your options trading platform will be live at your Netlify URL within 2-3 minutes! 🚀

---

## 🔗 Useful Links

- [Netlify Dashboard](https://app.netlify.com/)
- [Supabase Dashboard](https://supabase.com/dashboard/project/pfeikjkqqotksxwijcwh)
- [Repository](https://github.com/gdogra/refract.trade)
- [Next.js on Netlify Docs](https://docs.netlify.com/frameworks/next-js/)