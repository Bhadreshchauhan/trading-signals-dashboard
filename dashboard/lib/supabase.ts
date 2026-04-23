import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Signal = {
  id: string
  symbol: string
  signal_type: 'BUY' | 'EXIT' | 'ADD' | 'TRAIL' | 'NO_SIGNAL'
  price: number
  stop_loss: number | null
  quantity: number | null
  risk_per_share: number | null
  pnl: number | null
  weekly_rsi: number | null
  monthly_rsi: number | null
  weekly_ma20: number | null
  monthly_ma20: number | null
  notes: string | null
  scanned_at: string
}

export type Position = {
  id: string
  symbol: string
  quantity: number
  buy_price: number
  stop_loss: number
  position_added: boolean
  is_open: boolean
  opened_at: string
  updated_at: string
}
