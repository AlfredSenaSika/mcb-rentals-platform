import { createClient } from '@supabase/supabase-js';
import { MCB_CONFIG } from './config';

export const supabase = createClient(
  MCB_CONFIG.supabaseUrl,
  MCB_CONFIG.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
