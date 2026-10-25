import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dnlstelgkpcjwaarnrwr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubHN0ZWxna3BjandhYXJucndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjU3MzgsImV4cCI6MjEwMjY0MTczOH0.8YDSl25Lr1qxHaGXfnwRsTXQF60ynDpQEiN7F99IDlU'

let client
try {
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch (e) {
  console.warn('[Supabase Init Fallback]:', e)
}

export const supabase = client || {
  channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  removeChannel: () => {},
  storage: { 
    from: () => ({ 
      upload: async () => ({ error: null }), 
      getPublicUrl: () => ({ data: { publicUrl: '' } }) 
    }) 
  }
}

