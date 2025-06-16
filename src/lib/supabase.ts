import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env file");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
});

// Initialize auth state from localStorage
const initializeAuth = async () => {
  try {
    const session = localStorage.getItem('supabase.auth.token');
    if (session) {
      const { access_token } = JSON.parse(session);
      await supabase.auth.setSession({
        access_token,
        refresh_token: '',
      });
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
};

initializeAuth();
