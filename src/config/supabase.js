import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eaxnrubjkwjjmfharhce.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVheG5ydWJqa3dqam1maGFyaGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjIyNzUsImV4cCI6MjA5NTM5ODI3NX0.dr6UGRpUzusqb5TOG334AKp21sPH5Rkww9IlDpd5r50'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const STORAGE_BUCKET = 'item-images'

export const isSupabaseConfigured = () => {
  return supabaseUrl && !supabaseUrl.includes('your-project')
}
