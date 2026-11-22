import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { recetaDesdeDb } from '../data/catalogo'
import { useAuth } from './AuthContext'

const RecetasContext = createContext(null)

// Carga una sola vez las recetas visibles para el usuario: el catálogo público
// más las recetas propias de su familia (eso lo decide RLS en la base). También
// trae el catálogo de productos, con el que se arma la lista de mercado.
export function RecetasProvider({ children }) {
  const { familia, cargando: cargandoAuth } = useAuth()
  const familiaId = familia?.id ?? null
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    const [{ data, error: errorConsulta }, { data: catalogo }] = await Promise.all([
      supabase.from('recetas').select('*').order('id'),
      supabase.from('productos').select('id, nombre, seccion, unidad_compra, unidad_compra_plural, despensa, se_compra, equivalencias, alias'),
    ])
    // Sin catálogo la lista de mercado igual sale, con los ingredientes tal cual.
    if (catalogo) setProductos(catalogo)
    if (errorConsulta) {
      setError('No pudimos cargar las recetas. Intenta recargar la página.')
    } else {
      setError('')
      setRecetas(data.map(recetaDesdeDb))
    }
    setCargando(false)
  }, [])

  // Se vuelve a cargar al entrar/salir de una familia (cambian sus recetas).
  useEffect(() => {
    if (cargandoAuth) return
    recargar()
  }, [cargandoAuth, familiaId, recargar])

  const recetaPorId = useCallback((id) => recetas.find((r) => r.id === Number(id)), [recetas])

  const valor = useMemo(
    () => ({ recetas, productos, cargando, error, recargar, recetaPorId }),
    [recetas, productos, cargando, error, recargar, recetaPorId]
  )

  return <RecetasContext.Provider value={valor}>{children}</RecetasContext.Provider>
}

export function useRecetas() {
  const contexto = useContext(RecetasContext)
  if (!contexto) throw new Error('useRecetas debe usarse dentro de <RecetasProvider>')
  return contexto
}
