import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client-side Supabase client
export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    throw new Error('Supabase configuration is missing')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// Server-side Supabase client
export const createSupabaseServerClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables for server client')
    throw new Error('Supabase configuration is missing')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Admin Supabase client with service role key
export const createSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase admin environment variables:', {
      url: !!supabaseUrl,
      serviceKey: !!supabaseServiceKey
    })
    throw new Error('Supabase admin configuration is missing')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-admin'
      }
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