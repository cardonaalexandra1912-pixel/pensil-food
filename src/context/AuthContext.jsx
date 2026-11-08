import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, urlRaizApp } from '../lib/supabase'

// Ruta a la que volver después de ingresar con Google (el ida y vuelta a
// Google recarga la página, así que la guardamos en localStorage).
const CLAVE_VOLVER_A = 'pensil-food:volver-a'

const AuthContext = createContext(null)

// Maneja la sesión de Supabase, el perfil del usuario y su familia.
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null)
  const [sesionLista, setSesionLista] = useState(false)
  const [perfil, setPerfil] = useState(null)
  const [familia, setFamilia] = useState(null)
  // id del usuario cuyos datos (perfil + familia) ya están cargados
  const [datosCargadosDe, setDatosCargadosDe] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setSesionLista(true)
    })
    // Importante: no llamar a Supabase dentro de este callback (puede bloquearse),
    // solo actualizar el estado; los datos se cargan en el efecto de abajo.
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion)
      setSesionLista(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const usuario = sesion?.user ?? null
  const userId = usuario?.id ?? null

  const recargarDatosUsuario = useCallback(async () => {
    if (!userId) {
      setPerfil(null)
      setFamilia(null)
      setDatosCargadosDe(null)
      return
    }
    const [respuestaPerfil, respuestaFamilia] = await Promise.all([
      supabase.from('perfiles').select('id, nombre, avatar_url').eq('id', userId).maybeSingle(),
      supabase
        .from('familia_miembros')
        .select('rol, familia:familias(id, nombre, codigo_invitacion)')
        .eq('user_id', userId)
        .maybeSingle(),
    ])
    setPerfil(respuestaPerfil.data ?? null)
    const fila = respuestaFamilia.data
    setFamilia(fila?.familia ? { ...fila.familia, rol: fila.rol } : null)
    setDatosCargadosDe(userId)
  }, [userId])

  useEffect(() => {
    recargarDatosUsuario()
  }, [recargarDatosUsuario])

  const iniciarConGoogle = useCallback(async (volverA = '/') => {
    try {
      localStorage.setItem(CLAVE_VOLVER_A, volverA)
    } catch {
      // sin localStorage simplemente volvemos al inicio
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: urlRaizApp() },
    })
    if (error) throw error
  }, [])

  const iniciarConCorreo = useCallback(async (correo, contrasena) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    })
    if (error) throw error
  }, [])

  // Devuelve true si la cuenta quedó con sesión abierta, false si falta
  // confirmar el correo.
  const registrarse = useCallback(async (nombre, correo, contrasena) => {
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: contrasena,
      options: {
        data: { full_name: nombre.trim() },
        emailRedirectTo: urlRaizApp(),
      },
    })
    if (error) throw error
    return Boolean(data.session)
  }, [])

  // Correo con el enlace para poner una contraseña nueva (lleva a /nueva-contrasena).
  const enviarRecuperacion = useCallback(async (correo) => {
    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
      redirectTo: `${urlRaizApp()}nueva-contrasena`,
    })
    if (error) throw error
  }, [])

  const cambiarContrasena = useCallback(async (contrasena) => {
    const { error } = await supabase.auth.updateUser({ password: contrasena })
    if (error) throw error
  }, [])

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const actualizarNombre = useCallback(
    async (nombre) => {
      const { error } = await supabase.from('perfiles').update({ nombre: nombre.trim() }).eq('id', userId)
      if (error) throw error
      await recargarDatosUsuario()
    },
    [userId, recargarDatosUsuario]
  )

  // --- Familia (todas pasan por funciones RPC de la base) ---
  const crearFamilia = useCallback(
    async (nombre) => {
      const { error } = await supabase.rpc('crear_familia', { p_nombre: nombre })
      if (error) throw error
      await recargarDatosUsuario()
    },
    [recargarDatosUsuario]
  )

  const unirseAFamilia = useCallback(
    async (codigo) => {
      const { error } = await supabase.rpc('unirse_a_familia', { p_codigo: codigo })
      if (error) throw error
      await recargarDatosUsuario()
    },
    [recargarDatosUsuario]
  )

  const salirDeFamilia = useCallback(async () => {
    const { error } = await supabase.rpc('salir_de_familia')
    if (error) throw error
    await recargarDatosUsuario()
  }, [recargarDatosUsuario])

  const regenerarCodigo = useCallback(async () => {
    const { error } = await supabase.rpc('regenerar_codigo_familia')
    if (error) throw error
    await recargarDatosUsuario()
  }, [recargarDatosUsuario])

  const renombrarFamilia = useCallback(
    async (nombre) => {
      const { error } = await supabase.from('familias').update({ nombre: nombre.trim() }).eq('id', familia?.id)
      if (error) throw error
      await recargarDatosUsuario()
    },
    [familia?.id, recargarDatosUsuario]
  )

  const cargando = !sesionLista || (userId !== null && datosCargadosDe !== userId)

  const valor = useMemo(
    () => ({
      sesion,
      usuario,
      perfil,
      familia,
      cargando,
      iniciarConGoogle,
      iniciarConCorreo,
      registrarse,
      enviarRecuperacion,
      cambiarContrasena,
      cerrarSesion,
      actualizarNombre,
      crearFamilia,
      unirseAFamilia,
      salirDeFamilia,
      regenerarCodigo,
      renombrarFamilia,
      recargarDatosUsuario,
    }),
    [
      sesion,
      usuario,
      perfil,
      familia,
      cargando,
      iniciarConGoogle,
      iniciarConCorreo,
      registrarse,
      enviarRecuperacion,
      cambiarContrasena,
      cerrarSesion,
      actualizarNombre,
      crearFamilia,
      unirseAFamilia,
      salirDeFamilia,
      regenerarCodigo,
      renombrarFamilia,
      recargarDatosUsuario,
    ]
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return contexto
}

// Lee (y borra) la ruta guardada antes de ir a Google.
export function tomarRutaPendiente() {
  try {
    const ruta = localStorage.getItem(CLAVE_VOLVER_A)
    localStorage.removeItem(CLAVE_VOLVER_A)
    return ruta
  } catch {
    return null
  }
}
