# Supabase Setup Guide for Refract.trade

This guide will help you configure your Supabase database for the Refract.trade application.

## 🗄️ Database Setup

### 1. Access Your Supabase Project
- Go to: https://supabase.com/dashboard/project/pfeikjkqqotksxwijcwh
- Navigate to the SQL Editor

### 2. Run Database Schema
1. Copy the contents of `supabase-setup.sql`
2. Paste into the Supabase SQL Editor
3. Click "Run" to create all tables, indexes, and policies

This will create:
- ✅ All user and trading data tables
- ✅ Row Level Security (RLS) policies
- ✅ Performance indexes
- ✅ Auto-updating timestamp triggers

## 🔑 Environment Configuration

### 3. Get Supabase Credentials
From your Supabase dashboard, collect:

1. **Project URL**: `https://pfeikjkqqotksxwijcwh.supabase.co`
2. **Database URL**: Found in Settings → Database
3. **API Keys**: Found in Settings → API

### 4. Update Environment Variables
Create a `.env.local` file in your project root:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres.pfeikjkqqotksxwijcwh:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.pfeikjkqqotksxwijcwh:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://pfeikjkqqotksxwijcwh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"

# NextAuth.js
NEXTAUTH_SECRET="[GENERATE_A_RANDOM_SECRET]"
NEXTAUTH_URL="http://localhost:3000"

# Market Data APIs (Optional - for development)
IEX_API_KEY="[YOUR_IEX_API_KEY]"
POLYGON_API_KEY="[YOUR_POLYGON_API_KEY]"
INTRINIO_API_KEY="[YOUR_INTRINIO_API_KEY]"

# AI/ML Services (Optional)
OPENAI_API_KEY="[YOUR_OPENAI_API_KEY]"
```

**Important**: Replace `[YOUR_PASSWORD]` with your actual database password!

## 📱 Application Setup

### 5. Install Dependencies
```bash
npm install
```

### 6. Generate Prisma Client
```bash
npx prisma generate
```

### 7. Push Schema to Database (Alternative to SQL)
If you prefer using Prisma migrations:
```bash
npx prisma db push
```

### 8. Start Development Server
```bash
npm run dev
```

## 🔐 Authentication Configuration

### 9. Configure Supabase Auth (Optional)
If you want to use Supabase Auth instead of NextAuth:

1. Go to Authentication → Settings in Supabase
2. Configure your site URL: `http://localhost:3000`
3. Add redirect URLs for production

### 10. Test the Setup
1. Visit: http://localhost:3000
2. Try creating a new account via Sign Up
3. Check your Supabase dashboard to see the new user

## 🚀 Production Deployment

### 11. Environment Variables for Production
Update your hosting platform (Vercel, Netlify, etc.) with:

```env
DATABASE_URL="[PRODUCTION_DATABASE_URL]"
DIRECT_URL="[PRODUCTION_DATABASE_URL]"
NEXT_PUBLIC_SUPABASE_URL="https://pfeikjkqqotksxwijcwh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
NEXTAUTH_SECRET="[PRODUCTION_SECRET]"
NEXTAUTH_URL="https://your-domain.com"
```

### 12. Configure Auth Redirect URLs
In Supabase Auth settings, add your production URLs:
- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/**`

## 🧪 Testing the Integration

### User Registration Test
1. Go to `/auth/signup`
2. Create a test account
3. Check Supabase dashboard → Table Editor → users
4. Verify the user was created with profile

### Authentication Test
1. Sign in with your test account
2. Check that you're redirected to `/dashboard`
3. Verify session persistence

### Database Operations Test
1. Try creating sample positions or strategies
2. Check the data appears in Supabase tables
3. Test real-time subscriptions if implemented

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Error**
- Verify DATABASE_URL is correct
- Check your database password
- Ensure IP allowlisting if applicable

**Authentication Not Working**
- Verify NEXTAUTH_SECRET is set
- Check Supabase RLS policies
- Ensure auth callback URLs match

**RLS Permission Denied**
- Check that RLS policies are created
- Verify user authentication flow
- Test with service role key if needed

**Real-time Not Working**
- Enable realtime in Supabase for required tables
- Check WebSocket connection
- Verify subscription code

### Development Tips

1. **Use Supabase Studio**: Great for debugging queries and viewing data
2. **Check Logs**: Monitor both Next.js console and Supabase logs
3. **Test RLS**: Use different user accounts to verify data isolation
4. **Performance**: Monitor query performance in Supabase dashboard

## 📊 Next Steps

Once Supabase is configured:

1. **Market Data Integration**: Connect to IEX Cloud, Polygon.io
2. **Real-time Features**: Implement WebSocket subscriptions  
3. **Risk Engine**: Build Greeks calculations and portfolio risk
4. **AI Features**: Integrate OpenAI for strategy recommendations
5. **Mobile App**: Add React Native with Supabase integration

## 🆘 Support

If you encounter issues:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Review [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- Join the [Supabase Discord](https://discord.supabase.com)

---

Your Supabase database is now ready for the Refract.trade options trading platform! 🚀