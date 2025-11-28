import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

// Obtener URL de la API desde variables de entorno
// En desarrollo, usar ruta relativa para que funcione con el proxy de Vite
// En producción, usar la URL absoluta si está configurada
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

// Validar que VITE_API_URL sea una URL válida (no un token JWT)
let envApiUrl = import.meta.env.VITE_API_URL
if (envApiUrl && (envApiUrl.startsWith('eyJ') || envApiUrl.includes('eyJ') && !envApiUrl.startsWith('http'))) {
  console.warn('⚠️ VITE_API_URL contiene un token JWT en lugar de una URL. Ignorando...')
  envApiUrl = undefined
}

const API_URL = envApiUrl || (isDevelopment ? '' : 'http://localhost:8000')
// FORZAR uso de ruta relativa en desarrollo para usar el proxy de Vite
// Solo usar URL absoluta si VITE_API_URL es una URL válida (empieza con http)
const BASE_URL = (isDevelopment && (!envApiUrl || !envApiUrl.startsWith('http'))) ? '/api/v1' : `${API_URL}/api/v1`

console.log('🔧 Configuración API:', {
  isDevelopment,
  VITE_API_URL: envApiUrl || 'no configurado',
  BASE_URL,
  mode: import.meta.env.MODE
})

// Función para limpiar tokens malformados del localStorage
function cleanInvalidTokens() {
  try {
    // Limpiar auth-storage si contiene tokens inválidos
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authData = JSON.parse(authStorage)
      const token = authData?.state?.token
      
      // Si el token es una URL, contiene localhost:5173, o es un JWT muy largo, limpiarlo
      // NO rechazar tokens que contengan 'eyJ' porque los JWT válidos siempre lo contienen
      if (token && typeof token === 'string' && (
        token.startsWith('http://') || 
        token.startsWith('https://') || 
        token.includes('localhost:5173') ||
        token.length > 2000  // Tokens JWT válidos pueden ser largos pero no más de 2000 caracteres
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
    // Limpiar auth-storage solo si contiene tokens claramente inválidos (URLs, etc.)
    // NO eliminar tokens JWT válidos que contengan 'eyJ'
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const authData = JSON.parse(authStorage)
      const token = authData?.state?.token
      if (token && typeof token === 'string') {
        const isInvalid = token.startsWith('http://') || 
                         token.startsWith('https://') || 
                         token.includes('localhost:5173') ||
                         token.length > 2000
        if (isInvalid) {
          console.warn('🧹 LIMPIEZA AGRESIVA: Eliminando token inválido del localStorage')
          localStorage.removeItem('auth-storage')
        }
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
  // Configurar para preservar headers en redirects
  maxRedirects: 5,
  validateStatus: (status) => status < 500, // Permitir redirects (3xx)
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

// Función helper para obtener el baseURL correcto
function getForcedBaseURL() {
  return (isDevelopment && !import.meta.env.VITE_API_URL) ? '/api/v1' : BASE_URL
}

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // PASO 1: Limpiar tokens de Supabase y tokens inválidos
    try {
      // Limpiar token de Supabase si existe
      if (localStorage.getItem('supabase.auth.token')) {
        console.warn('🧹 Limpiando token de Supabase del localStorage')
        localStorage.removeItem('supabase.auth.token')
      }
      
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          const token = authData?.state?.token
          
          // Si el token es un objeto (no string), es inválido - limpiar
          if (token && typeof token !== 'string') {
            console.warn('🧹 Eliminando auth-storage con token inválido (no es string):', typeof token)
            localStorage.removeItem('auth-storage')
          } else if (token && typeof token === 'string') {
            // Solo eliminar tokens que sean claramente inválidos (URLs, etc.)
            const isInvalidToken = token.startsWith('http://') || 
                                  token.startsWith('https://') || 
                                  token.includes('localhost:5173') ||
                                  (token.length > 2000)  // Tokens muy largos probablemente están malformados
            
            if (isInvalidToken) {
              console.warn('🧹 Eliminando token inválido del localStorage:', token.substring(0, 50))
              localStorage.removeItem('auth-storage')
            }
          }
        } catch (e) {
          // Si hay error al parsear, limpiar
          console.warn('⚠️ Error al parsear auth-storage, limpiando:', e)
          localStorage.removeItem('auth-storage')
        }
      }
    } catch (e) {
      // Ignorar errores
    }
    
    // PASO 2: FORZAR baseURL correcto - SIEMPRE
    // En desarrollo, SIEMPRE usar ruta relativa para el proxy de Vite
    const forcedBaseURL = getForcedBaseURL()
    config.baseURL = forcedBaseURL
    if (config.baseURL !== forcedBaseURL) {
      console.warn(`⚠️ baseURL fue modificado, forzando: ${forcedBaseURL}`)
      config.baseURL = forcedBaseURL
    }
    
    // PASO 3: Validar y corregir config.url si contiene tokens
    if (config.url) {
      // Si la URL contiene un JWT token (empieza con 'eyJ'), es un token de Supabase malformado
      // Extraer solo la ruta final o usar la ruta por defecto
      if (config.url.startsWith('eyJ') || (config.url.includes('eyJ') && !config.url.startsWith('/'))) {
        console.error('❌ URL contiene token JWT (probablemente de Supabase). Limpiando...')
        console.error('❌ URL malformada:', config.url)
        
        // Limpiar tokens de Supabase del localStorage
        try {
          localStorage.removeItem('supabase.auth.token')
          const authStorage = localStorage.getItem('auth-storage')
          if (authStorage) {
            const authData = JSON.parse(authStorage)
            if (authData?.state?.token && typeof authData.state.token === 'object') {
              console.warn('🧹 Limpiando auth-storage con token inválido (objeto)')
              localStorage.removeItem('auth-storage')
            }
          }
        } catch (e) {
          console.error('Error limpiando tokens:', e)
        }
        
        // Buscar la ruta después de /api/v1/ o usar la ruta por defecto
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
          // Si aún no encontramos nada, usar /auth/login como fallback (más común)
          if (config.url.startsWith('eyJ') || config.url.includes('eyJ')) {
            config.url = '/auth/login'
          }
        }
        // Forzar baseURL nuevamente
        config.baseURL = getForcedBaseURL()
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
    
    // PASO 5: Obtener token válido del localStorage (solo si no hay Authorization ya configurado)
    // Respetar headers Authorization que se pasen manualmente (ej: en login)
    const hasManualAuth = config.headers?.Authorization || 
                          (config.headers as any)?.authorization
    
    if (!hasManualAuth) {
      const authStorage = localStorage.getItem('auth-storage')
      console.log(`🔍 [${config.url}] Verificando token. auth-storage existe: ${!!authStorage}`)
      
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          console.log(`🔍 [${config.url}] Estructura auth-storage:`, {
            hasState: !!authData?.state,
            hasToken: !!authData?.state?.token,
            tokenLength: authData?.state?.token?.length || 0,
            tokenPreview: authData?.state?.token?.substring(0, 20) || 'N/A'
          })
          
          const token = authData?.state?.token
          
          // Verificar que el token sea un string válido
          // Si es un objeto, no es un token válido de FastAPI
          if (!token || typeof token !== 'string') {
            console.warn(`⚠️ [${config.url}] Token no es un string válido. Tipo: ${typeof token}`, token)
            // Limpiar auth-storage si el token es inválido
            if (token && typeof token === 'object') {
              console.warn('🧹 Limpiando auth-storage con token inválido (objeto)')
              localStorage.removeItem('auth-storage')
            }
          } else if (token.trim().length > 0) {
            // Solo usar tokens que sean válidos (no URLs, no muy largos)
            // Los tokens JWT válidos siempre comienzan con 'eyJ' (base64 de '{"'), así que NO rechazarlos
            const isInvalid = token.startsWith('http://') || 
                             token.startsWith('https://') || 
                             token.includes('localhost:5173') || 
                             token.length > 2000  // Tokens JWT pueden ser largos pero no más de 2000 caracteres
            
            if (!isInvalid) {
              // Token válido de FastAPI, agregarlo a los headers
              config.headers.Authorization = `Bearer ${token}`
              console.log(`✅ [${config.url}] Token agregado al header Authorization (${token.length} chars)`)
            } else {
              console.warn(`⚠️ [${config.url}] Token inválido detectado:`, {
                startsWithHttp: token.startsWith('http://'),
                startsWithHttps: token.startsWith('https://'),
                hasLocalhost: token.includes('localhost:5173'),
                tooLong: token.length > 2000
              })
              // Limpiar token inválido
              localStorage.removeItem('auth-storage')
            }
          }
        } catch (e) {
          console.error('❌ Error parsing auth token:', e)
          localStorage.removeItem('auth-storage')
        }
      } else {
        console.warn(`⚠️ [${config.url}] No hay auth-storage en localStorage`)
      }
    } else {
      console.log(`✅ [${config.url}] Usando Authorization header manual`)
    }
    
    // PASO 6: VALIDACIÓN FINAL - Asegurar que baseURL y url sean correctos
    // En desarrollo, SIEMPRE usar ruta relativa para el proxy de Vite
    config.baseURL = getForcedBaseURL()
    
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
    const finalForcedBaseURL = getForcedBaseURL()
    if (!config.baseURL || 
        config.baseURL.includes('eyJ') || 
        config.baseURL.includes('localhost:5173') ||
        config.baseURL !== finalForcedBaseURL) {
      console.error('❌ baseURL malformado detectado. Forzando corrección final.')
      config.baseURL = finalForcedBaseURL
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
    
    // PASO 9: Última validación - asegurar que baseURL sea correcto
    // En desarrollo, SIEMPRE usar ruta relativa para el proxy de Vite
    config.baseURL = getForcedBaseURL()
    
    // PASO 10: Log final del header Authorization antes de enviar
    const finalAuthHeader = config.headers?.Authorization || (config.headers as any)?.authorization
    if (finalAuthHeader) {
      console.log(`✅ [${config.url}] Header Authorization configurado: ${finalAuthHeader.substring(0, 30)}...`)
    } else {
      console.warn(`⚠️ [${config.url}] NO hay header Authorization configurado`)
    }
    
    // PASO 11: Log de la URL completa que se enviará
    const fullUrl = `${config.baseURL}${config.url}`
    console.log(`🌐 [${config.method?.toUpperCase()}] URL completa: ${fullUrl}`)
    console.log(`📋 Headers:`, {
      Authorization: finalAuthHeader ? `${finalAuthHeader.substring(0, 30)}...` : 'NO HAY',
      'Content-Type': config.headers?.['Content-Type'] || 'NO HAY',
      baseURL: config.baseURL,
      url: config.url
    })
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar redirects y errores
api.interceptors.response.use(
  (response) => {
    // Si hay un redirect, los headers deberían preservarse automáticamente
    if (response.status >= 300 && response.status < 400) {
      console.log(`🔄 Redirect detectado: ${response.status} - ${response.config.url}`)
    }
    return response
  },
  (error) => {
    // Si el error es 401 después de un redirect, intentar reenviar con token
    if (error.response?.status === 401 && error.config && !error.config._retry) {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          const token = authData?.state?.token
          if (token && typeof token === 'string' && token.trim().length > 0) {
            const isInvalid = token.startsWith('http://') || 
                             token.startsWith('https://') || 
                             token.includes('localhost:5173') || 
                             token.length > 2000
            if (!isInvalid) {
              error.config._retry = true
              error.config.headers = error.config.headers || {}
              error.config.headers.Authorization = `Bearer ${token}`
              console.log('🔄 Reintentando petición con token después de 401')
              return api.request(error.config)
            }
          }
        } catch (e) {
          console.error('Error al procesar token en interceptor de error:', e)
        }
      }
    }
    
    if (error.response?.status === 401) {
      // Token expirado o inválido - solo redirigir si no es un retry
      if (!error.config?._retry) {
        console.log('❌ Token inválido o expirado, redirigiendo a login')
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)


