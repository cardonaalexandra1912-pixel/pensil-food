import { createClient } from '@supabase/supabase-js'

// URL y llave publicable del proyecto "Pensil.Food" en Supabase. La llave
// publicable está hecha para vivir en el navegador: lo que protege los datos
// son las políticas RLS de la base (ver supabase/migrations/). Se pueden
// sobrescribir con VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nredvzzxzgsckyyhfnqk.supabase.co'
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ozrX-V04a7wQ54qPLRRl-w_fBDgN21a'

// El ingreso con Google ya está programado, pero queda apagado hasta activar
// el proveedor en Supabase (cuando exista el dominio definitivo). Para
// encenderlo: VITE_GOOGLE_HABILITADO=true en el build, o cambiar este valor.
export const GOOGLE_HABILITADO = import.meta.env.VITE_GOOGLE_HABILITADO === 'true'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// URL absoluta de la raíz de la app (incluye el /pensil-food/ de GitHub Pages).
export function urlRaizApp() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

// Traduce los errores más comunes de Supabase a mensajes en español.
export function mensajeError(error) {
  if (!error) return ''
  const texto = error.message || String(error)
  if (texto.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (texto.includes('Email not confirmed')) return 'Confirma tu correo antes de ingresar (revisa tu bandeja de entrada).'
  if (texto.includes('User already registered')) return 'Ya existe una cuenta con ese correo.'
  if (texto.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (texto.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
  if (texto.includes('provider is not enabled')) return 'El ingreso con Google todavía no está activado en Supabase.'
  if (texto.includes('should be different from the old password'))
    return 'La contraseña nueva tiene que ser distinta a la anterior.'
  if (texto.includes('Auth session missing')) return 'El enlace ya no sirve. Pide uno nuevo desde «¿Olvidaste tu contraseña?».'
  if (texto.includes('Unable to validate email address')) return 'Revisa el correo: parece que está mal escrito.'
  if (texto.includes('Failed to fetch')) return 'No pudimos conectarnos. Revisa tu conexión a internet.'
  return texto
}
