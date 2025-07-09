// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and Anon Key from your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export the Supabase client instance
// This single instance will be imported by any component that needs to
// communicate with Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);