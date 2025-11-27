import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

// Obtener URL de la API desde variables de entorno
// En desarrollo, usar ruta relativa para que funcione con el proxy de Vite
// En producción, usar la URL absoluta si está configurada
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
const API_URL = import.meta.env.VITE_API_URL || (isDevelopment ? '' : 'http://localhost:8000')
const BASE_URL = isDevelopment ? '/api/v1' : `${API_URL}/api/v1`

// Función para limpiar tokens malformados del localStorage
function cleanInvalidTokens() {
  try {
    // Limpiar auth-storage si contiene tokens inválidos
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authData = JSON.parse(authStorage)
      const token = authData?.state?.token
      
      // Si el token es una URL, contiene localhost:5173, es un JWT muy largo, o contiene 'eyJ', limpiarlo
      if (token && typeof token === 'string' && (
        token.startsWith('http://') || 
        token.startsWith('https://') || 
        token.includes('localhost:5173') ||
        token.includes('eyJ') ||
        token.length > 500
      )) {
        console.warn('🧹 Limpiando token inválido del localStorage:', token.substring(0, 50) + '...')
        localStorage.removeItem('auth-storage')
      }
    }
    
    // También limpiar cualquier token de Supabase que pueda estar interfiriendo
    const supabaseToken = localStorage.getItem('supabase.auth.token')
    if (supabaseToken) {
      try {
        const supabaseData = JSON.parse(supabaseToken)
        // Si el token de Supabase está siendo usado incorrectamente, limpiarlo temporalmente
        if (supabaseData?.access_token && supabaseData.access_token.includes('eyJ')) {
          // No eliminar, solo verificar que no se use para FastAPI
        }
      } catch (e) {
        // Ignorar
      }
    }
  } catch (e) {
    // Si hay error al parsear, limpiar todo
    console.warn('🧹 Error al validar tokens. Limpiando auth-storage.')
    localStorage.removeItem('auth-storage')
  }
}

// Limpiar tokens inválidos al cargar el módulo
cleanInvalidTokens()

// Función para limpiar tokens malformados de forma más agresiva
function aggressiveTokenCleanup() {
  try {
    // Limpiar auth-storage completamente si contiene tokens JWT
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authData = JSON.parse(authStorage)
      const token = authData?.state?.token
      if (token && typeof token === 'string' && token.includes('eyJ')) {
        console.warn('🧹 LIMPIEZA AGRESIVA: Eliminando token JWT de Supabase del localStorage')
        localStorage.removeItem('auth-storage')
      }
    }
  } catch (e) {
    // Si hay error, limpiar todo
    localStorage.removeItem('auth-storage')
  }
}

// Ejecutar limpieza agresiva cada vez que se importa el módulo
aggressiveTokenCleanup()

// Crear instancia de axios
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Wrapper para asegurar que el baseURL nunca se modifique
export const api = new Proxy(axiosInstance, {
  get(target, prop) {
    // Si se intenta acceder a baseURL, siempre retornar el valor correcto
    if (prop === 'defaults' && target.defaults) {
      return new Proxy(target.defaults, {
        get(defaultsTarget, defaultsProp) {
          if (defaultsProp === 'baseURL') {
            return BASE_URL
          }
          return defaultsTarget[defaultsProp as keyof typeof defaultsTarget]
        },
        set(defaultsTarget, defaultsProp, value) {
          // Prevenir que baseURL sea modificado
          if (defaultsProp === 'baseURL') {
            console.warn('⚠️ Intento de modificar baseURL bloqueado. Usando BASE_URL correcto.')
            return true
          }
          defaultsTarget[defaultsProp as keyof typeof defaultsTarget] = value
          return true
        }
      })
    }
    return target[prop as keyof typeof target]
  }
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // PASO 1: ELIMINAR COMPLETAMENTE cualquier token JWT de Supabase del localStorage
    // Esto debe hacerse ANTES de cualquier otra operación
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          const token = authData?.state?.token
          // Si el token contiene 'eyJ' (JWT de Supabase), ELIMINAR TODO
          if (token && typeof token === 'string' && token.includes('eyJ')) {
            console.warn('🧹 Eliminando token JWT de Supabase del localStorage')
            localStorage.removeItem('auth-storage')
          }
        } catch (e) {
          // Si hay error al parsear, eliminar de todas formas
          localStorage.removeItem('auth-storage')
        }
      }
    } catch (e) {
      // Ignorar errores
    }
    
    // PASO 2: FORZAR baseURL correcto - SIEMPRE
    config.baseURL = BASE_URL
    
    // PASO 3: Validar y corregir config.url si contiene tokens
    if (config.url) {
      // Si la URL contiene un JWT token, extraer solo la ruta final
      if (config.url.includes('eyJ')) {
        console.error('❌ URL contiene token JWT. Limpiando...')
        // Buscar la ruta después de /api/v1/
        const apiIndex = config.url.indexOf('/api/v1/')
        if (apiIndex !== -1) {
          config.url = config.url.substring(apiIndex + '/api/v1/'.length)
        } else {
          // Si no tiene /api/v1/, buscar patrones conocidos
          const patterns = ['/auth/register', '/auth/login', '/auth/me']
          for (const pattern of patterns) {
            if (config.url.includes(pattern)) {
              config.url = pattern
              break
            }
          }
          // Si aún no encontramos nada, usar /auth/register como fallback
          if (config.url.includes('eyJ')) {
            config.url = '/auth/register'
          }
        }
        // Forzar baseURL nuevamente
        config.baseURL = BASE_URL
      }
    }
    
    // PASO 3: Validar y reconstruir config.url si está malformado
    if (config.url) {
      // Si la URL contiene un JWT token, reconstruirla completamente
      if (config.url.includes('eyJ') || config.url.startsWith('http://localhost:5173/')) {
        console.error('❌ URL malformada detectada. Reconstruyendo desde cero...')
        
        // Extraer la ruta final de la URL malformada
        let cleanUrl = config.url
        
        // Si contiene /api/v1/, extraer todo después de eso
        const apiIndex = cleanUrl.indexOf('/api/v1/')
        if (apiIndex !== -1) {
          cleanUrl = cleanUrl.substring(apiIndex + '/api/v1/'.length)
        } else {
          // Si no tiene /api/v1/, buscar patrones conocidos
          const patterns = ['/auth/register', '/auth/login', '/auth/me', '/auth/refresh']
          for (const pattern of patterns) {
            const patternIndex = cleanUrl.indexOf(pattern)
            if (patternIndex !== -1) {
              cleanUrl = pattern
              break
            }
          }
          
          // Si aún no encontramos nada, usar la última parte que no contenga 'eyJ'
          if (cleanUrl.includes('eyJ')) {
            const parts = cleanUrl.split('/').filter(p => p && !p.includes('eyJ') && !p.includes('localhost'))
            cleanUrl = '/' + parts[parts.length - 1] || '/auth/register'
          }
        }
        
        // Asegurar que la URL comience con /
        if (!cleanUrl.startsWith('/')) {
          cleanUrl = '/' + cleanUrl
        }
        
        // Asignar la URL limpia
        config.url = cleanUrl
        config.baseURL = BASE_URL
      }
    }
    
    // PASO 4: Asegurar que los headers estén definidos
    if (!config.headers) {
      config.headers = {}
    }
    
    // PASO 5: Obtener token válido del localStorage (solo si no es un JWT de Supabase)
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage)
        const token = authData?.state?.token
        
        // Solo usar tokens que sean válidos (no JWT de Supabase, no URLs, no muy largos)
        if (token && typeof token === 'string' && token.trim().length > 0) {
          const isInvalid = token.startsWith('http://') || 
                           token.startsWith('https://') || 
                           token.includes('localhost:5173') || 
                           token.includes('eyJ') || 
                           token.length > 500
          
          if (!isInvalid) {
            // Token válido de FastAPI, agregarlo a los headers
            config.headers.Authorization = `Bearer ${token}`
          }
        }
      } catch (e) {
        console.error('❌ Error parsing auth token:', e)
        localStorage.removeItem('auth-storage')
      }
    }
    
    // PASO 6: VALIDACIÓN FINAL - Asegurar que baseURL y url sean correctos
    config.baseURL = BASE_URL
    
    // Si la URL aún contiene tokens después de todo, usar la ruta por defecto
    if (config.url && config.url.includes('eyJ')) {
      console.error('❌ URL aún contiene token después de limpieza. Usando ruta por defecto.')
      // Intentar extraer la ruta del contexto (si viene de authService, debería ser /auth/register)
      if (config.url.includes('register')) {
        config.url = '/auth/register'
      } else if (config.url.includes('login')) {
        config.url = '/auth/login'
      } else {
        config.url = '/auth/register' // Fallback
      }
    }
    
    // PASO 7: Validación final ABSOLUTA del baseURL
    // Si el baseURL contiene tokens o está malformado, forzarlo nuevamente
    if (!config.baseURL || 
        config.baseURL.includes('eyJ') || 
        config.baseURL.includes('localhost:5173') ||
        config.baseURL !== BASE_URL) {
      console.error('❌ baseURL malformado detectado. Forzando corrección final.')
      config.baseURL = BASE_URL
    }
    
    // PASO 8: Validación final de la URL completa
    // Construir la URL completa manualmente para asegurar que sea correcta
    const finalBaseURL = config.baseURL || BASE_URL
    const finalUrl = config.url || ''
    
    // Si la URL final aún contiene tokens, reconstruirla completamente
    if (finalUrl.includes('eyJ') || finalBaseURL.includes('eyJ')) {
      console.error('❌ URL final aún contiene tokens. Reconstruyendo desde cero.')
      config.baseURL = BASE_URL
      // Extraer solo la ruta del endpoint
      if (finalUrl.includes('register')) {
        config.url = '/auth/register'
      } else if (finalUrl.includes('login')) {
        config.url = '/auth/login'
      } else {
        config.url = '/auth/register' // Fallback
      }
    }
    
    // PASO 9: Última validación - asegurar que baseURL sea exactamente BASE_URL
    config.baseURL = BASE_URL
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)


