import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Tipos das tabelas ──────────────────────────────────────────────────────

export type CatalogProduct = {
  id: string
  user_id: string
  name: string
  brand: string | null
  category: string | null
  actives: string[] | null
  ph: number | null
  function_desc: string | null
  image_ref: string | null
  created_at: string
}

export type InventoryItem = {
  id: string
  user_id: string
  product_id: string
  purchase_date: string | null
  price: number | null
  store: string | null
  expiry_date: string | null
  status: 'aberto' | 'fechado' | 'acabou'
  rating: number | null
  created_at: string
  catalog_products?: CatalogProduct
}

export type RoutineDefinition = {
  id: string
  user_id: string
  name: string
  period: 'manha' | 'noite'
  created_at: string
}

export type RoutineItem = {
  id: string
  routine_id: string
  product_id: string
  sort_order: number
  day_of_week: number[]
  is_optional: boolean
  catalog_products?: CatalogProduct
}

export type UsageLog = {
  id: string
  user_id: string
  routine_id: string
  executed_at: string
  notes: string | null
  completed: boolean
}

export type UsageLogItem = {
  id: string
  log_id: string
  product_id: string
  checked: boolean
}

export type SkinProgress = {
  id: string
  user_id: string
  photo_url: string | null
  angle: 'frontal' | 'esquerdo' | 'direito' | null
  notes: string | null
  tags: string[] | null
  log_id: string | null
  taken_at: string
}
