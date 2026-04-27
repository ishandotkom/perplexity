import { BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY, BUN_PUBLIC_SUPABASE_URL } from '@/config/config'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    BUN_PUBLIC_SUPABASE_URL,
    BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}
