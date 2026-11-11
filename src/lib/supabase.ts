import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,   // guarda la sesión
    autoRefreshToken: true,  // renueva el token antes de que expire
    persistSession: true,    // recuerda la sessión al reabrir la app
    detectSessionInUrl: false, // en mobile no leemos la URL solo lo usaremos con Google
    flowType: 'pkce',
  },
});