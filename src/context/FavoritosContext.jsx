import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// Antes los favoritos vivían solo en este navegador; al ingresar por primera
// vez se suben a la cuenta y se borran de aquí.
const CLAVE_FAVORITOS_LOCALES = 'mis-recetas:favoritos'

const FavoritosContext = createContext(null)

export function FavoritosProvider({ children }) {
  const { usuario } = useAuth()
  const userId = usuario?.id ?? null
  const navigate = useNavigate()
  const location = useLocation()
  const [favoritos, setFavoritos] = useState([])

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      if (!userId) {
        setFavoritos([])
        return
      }
      await migrarFavoritosLocales(userId)
      const { data } = await supabase.from('favoritos').select('receta_id').eq('user_id', userId)
      if (!cancelado) setFavoritos((data ?? []).map((fila) => fila.receta_id))
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [userId])

  const esFavorito = useCallback((id) => favoritos.includes(id), [favoritos])

  // Si la receta ya es favorita la quita, si no lo es la agrega. Sin sesión,
  // lleva a la pantalla de ingreso.
  const alternarFavorito = useCallback(
    async (id) => {
      if (!userId) {
        navigate('/ingresar', { state: { desde: location.pathname + location.search } })
        return
      }
      const yaEsFavorito = favoritos.includes(id)
      // Actualización optimista: se ve el cambio al instante.
      setFavoritos((actuales) => (yaEsFavorito ? actuales.filter((f) => f !== id) : [...actuales, id]))
      const { error } = yaEsFavorito
        ? await supabase.from('favoritos').delete().eq('user_id', userId).eq('receta_id', id)
        : await supabase.from('favoritos').insert({ user_id: userId, receta_id: id })
      if (error) {
        setFavoritos((actuales) => (yaEsFavorito ? [...actuales, id] : actuales.filter((f) => f !== id)))
      }
    },
    [userId, favoritos, navigate, location.pathname, location.search]
  )

  const valor = useMemo(() => ({ favoritos, esFavorito, alternarFavorito }), [favoritos, esFavorito, alternarFavorito])

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>
}

export function useFavoritos() {
  const contexto = useContext(FavoritosContext)
  if (!contexto) throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>')
  return contexto
}

async function migrarFavoritosLocales(userId) {
  let ids = []
  try {
    ids = JSON.parse(localStorage.getItem(CLAVE_FAVORITOS_LOCALES) || '[]')
  } catch {
    ids = []
  }
  if (!Array.isArray(ids) || ids.length === 0) return
  const filas = ids.filter(Number.isInteger).map((receta_id) => ({ user_id: userId, receta_id }))
  const { error } = await supabase
    .from('favoritos')
    .upsert(filas, { onConflict: 'user_id,receta_id', ignoreDuplicates: true })
  if (!error) localStorage.removeItem(CLAVE_FAVORITOS_LOCALES)
}
