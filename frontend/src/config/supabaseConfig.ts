/**
 * Configuración básica de Supabase.
 * Lee las variables de entorno necesarias para inicializar el cliente.
 */

// Validar que las variables de entorno estén configuradas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '❌ VITE_SUPABASE_URL no está configurada. ' +
    'Agrega VITE_SUPABASE_URL en tu archivo .env'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ VITE_SUPABASE_ANON_KEY no está configurada. ' +
    'Agrega VITE_SUPABASE_ANON_KEY en tu archivo .env'
  );
}

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

