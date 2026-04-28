import { BUN_PUBLIC_SUPABASE_SECRET_KEY, BUN_PUBLIC_SUPABASE_URL } from './config'
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
    return createClient(
        BUN_PUBLIC_SUPABASE_URL!,
        BUN_PUBLIC_SUPABASE_SECRET_KEY!
    )
}