/**
 * Cliente de Supabase con configuraciones avanzadas.
 * Incluye autenticación persistente, auto-refresh, Realtime y funciones helper.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabaseConfig';

// Crear cliente de Supabase con configuraciones avanzadas
const supabase: SupabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      // Persistir sesión en localStorage
      persistSession: true,
      // Auto-refresh de tokens
      autoRefreshToken: true,
      // Detectar sesión en URL (para callbacks OAuth)
      detectSessionInUrl: true,
      // Storage key personalizado
      storageKey: 'supabase.auth.token',
    },
    // Schema de la base de datos
    db: {
      schema: 'public',
    },
    // Headers personalizados
    global: {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
    },
    // Configuración de Realtime
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Listener para cambios de autenticación
// Actualiza headers automáticamente cuando cambia la sesión
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Actualizar headers con el token si es necesario
    if (session?.access_token) {
      // El cliente maneja esto automáticamente, pero puedes agregar lógica adicional aquí
      console.log('✅ Sesión actualizada:', event);
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 Usuario cerró sesión');
  }
});

/**
 * Verificar si hay una sesión activa.
 * @returns Promise con la sesión actual o null
 */
export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Error al verificar sesión:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('❌ Error inesperado al verificar sesión:', error);
    return null;
  }
};

/**
 * Actualizar la sesión actual.
 * Útil para refrescar tokens o verificar estado.
 * @returns Promise con la sesión actualizada o null
 */
export const updateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('❌ Error al actualizar sesión:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('❌ Error inesperado al actualizar sesión:', error);
    return null;
  }
};

// Exportar cliente como default y funciones helper
export default supabase;
export { supabase };

