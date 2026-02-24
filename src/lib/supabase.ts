import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
export const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    throw new Error('Supabase configuration is missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
  
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// Server-side Supabase client
export const createSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    throw new Error('Supabase configuration is missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
  
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Admin Supabase client with service role key
export const createSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // During build time, environment variables may not be available
  if (typeof window === 'undefined' && (!url || !serviceKey)) {
    if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
      throw new Error('Supabase admin configuration is missing. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
    }
    // During build, return a mock client that won't be used
    console.warn('Supabase admin client not available during build process')
    throw new Error('Supabase admin configuration is missing during build process')
  }
  
  return createClient(url!, serviceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          subscription_tier: string
          subscription_expiry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar?: string | null
          subscription_tier?: string
          subscription_expiry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar?: string | null
          subscription_tier?: string
          subscription_expiry?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed
    }
  }
}

// Helper functions for common operations
export const supabase = {
  // Get current user session
  async getSession() {
    const supabase = createSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createSupabaseClient()
    return await supabase.auth.signInWithPassword({ email, password })
  },

  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: any) {
    const supabase = createSupabaseClient()
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  // Sign out
  async signOut() {
    const supabase = createSupabaseClient()
    return await supabase.auth.signOut()
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const supabase = createSupabaseClient()
    return await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    const supabase = createSupabaseClient()
    return await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
  },

  // Get user positions
  async getUserPositions(userId: string) {
    const supabase = createSupabaseClient()
    return await supabase
      .from('positions')
      .select(`
        *,
        position_legs(*),
        transactions(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
  },

  // Get portfolio snapshot
  async getLatestPortfolioSnapshot(userId: string) {
    const supabase = createSupabaseClient()
    return await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
  },

  // Get risk alerts
  async getRiskAlerts(userId: string, unreadOnly = false) {
    const supabase = createSupabaseClient()
    let query = supabase
      .from('risk_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    return await query
  },

  // Mark alert as read
  async markAlertAsRead(alertId: string) {
    const supabase = createSupabaseClient()
    return await supabase
      .from('risk_alerts')
      .update({ is_read: true })
      .eq('id', alertId)
  },

  // Get tax records for a year
  async getTaxRecords(userId: string, year: number) {
    const supabase = createSupabaseClient()
    return await supabase
      .from('tax_records')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('date_acquired', { ascending: false })
  },

  // Get active wash sales
  async getActiveWashSales(userId: string) {
    const supabase = createSupabaseClient()
    return await supabase
      .from('wash_sales')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('wash_period_end', new Date().toISOString())
  },

  // Real-time subscriptions
  subscribeToRiskAlerts(userId: string, callback: (payload: any) => void) {
    const supabase = createSupabaseClient()
    return supabase
      .channel('risk_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'risk_alerts',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToPositions(userId: string, callback: (payload: any) => void) {
    const supabase = createSupabaseClient()
    return supabase
      .channel('positions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}