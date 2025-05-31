import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database Types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          country: string | null
          nationality: string | null
          monthly_income: number | null
          monthly_expenses: number | null
          current_savings: number | null
          currency: string | null
          risk_profile: 'Conservative' | 'Balanced' | 'Growth' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          country?: string | null
          nationality?: string | null
          monthly_income?: number | null
          monthly_expenses?: number | null
          current_savings?: number | null
          currency?: string | null
          risk_profile?: 'Conservative' | 'Balanced' | 'Growth' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          country?: string | null
          nationality?: string | null
          monthly_income?: number | null
          monthly_expenses?: number | null
          current_savings?: number | null
          currency?: string | null
          risk_profile?: 'Conservative' | 'Balanced' | 'Growth' | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          category: 'Education' | 'Travel' | 'Gift' | 'Home' | 'Retirement' | null
          target_date: string
          amount: number
          horizon_months: number
          profile: 'Conservative' | 'Balanced' | 'Growth' | null
          required_pmt: number | null
          payment_frequency: 'Once' | 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual' | null
          payment_period: number | null
          custom_rates: any | null
          monthly_allocations: number[] | null
          buffer_months: number | null
          selected_bank: any | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: 'Education' | 'Travel' | 'Gift' | 'Home' | 'Retirement' | null
          target_date: string
          amount: number
          horizon_months: number
          profile?: 'Conservative' | 'Balanced' | 'Growth' | null
          required_pmt?: number | null
          payment_frequency?: 'Once' | 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual' | null
          payment_period?: number | null
          custom_rates?: any | null
          monthly_allocations?: number[] | null
          buffer_months?: number | null
          selected_bank?: any | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: 'Education' | 'Travel' | 'Gift' | 'Home' | 'Retirement' | null
          target_date?: string
          amount?: number
          horizon_months?: number
          profile?: 'Conservative' | 'Balanced' | 'Growth' | null
          required_pmt?: number | null
          payment_frequency?: 'Once' | 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual' | null
          payment_period?: number | null
          custom_rates?: any | null
          monthly_allocations?: number[] | null
          buffer_months?: number | null
          selected_bank?: any | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      goal_progress: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          month_year: string
          planned_amount: number
          actual_amount: number | null
          cumulative_planned: number
          cumulative_actual: number | null
          variance: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          month_year: string
          planned_amount: number
          actual_amount?: number | null
          cumulative_planned: number
          cumulative_actual?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          month_year?: string
          planned_amount?: number
          actual_amount?: number | null
          cumulative_planned?: number
          cumulative_actual?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      financial_plans: {
        Row: {
          id: string
          user_id: string
          plan_name: string
          funding_style: 'waterfall' | 'parallel' | 'hybrid' | null
          total_monthly_allocation: number | null
          plan_data: any
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_name: string
          funding_style?: 'waterfall' | 'parallel' | 'hybrid' | null
          total_monthly_allocation?: number | null
          plan_data: any
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_name?: string
          funding_style?: 'waterfall' | 'parallel' | 'hybrid' | null
          total_monthly_allocation?: number | null
          plan_data?: any
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_type: 'free' | 'premium' | 'professional' | null
          status: 'active' | 'cancelled' | 'past_due' | 'trialing' | null
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: 'free' | 'premium' | 'professional' | null
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing' | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: 'free' | 'premium' | 'professional' | null
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing' | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exports: {
        Row: {
          id: string
          user_id: string
          export_type: 'free_pdf' | 'premium_pdf' | 'excel' | 'complete_package' | null
          stripe_payment_intent_id: string | null
          amount: number | null
          currency: string | null
          status: 'pending' | 'completed' | 'failed' | null
          download_url: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          export_type?: 'free_pdf' | 'premium_pdf' | 'excel' | 'complete_package' | null
          stripe_payment_intent_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: 'pending' | 'completed' | 'failed' | null
          download_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          export_type?: 'free_pdf' | 'premium_pdf' | 'excel' | 'complete_package' | null
          stripe_payment_intent_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: 'pending' | 'completed' | 'failed' | null
          download_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
    }
  }
} 