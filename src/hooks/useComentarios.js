import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Configuración por tipo de comentario: tabla y columna que lo relaciona.
const TIPOS = {
  receta: { tabla: 'comentarios_receta', columna: 'receta_id' },
  menu: { tabla: 'comentarios_menu', columna: 'menu_id' },
}

// Comentarios de una receta o de un menú semanal, visibles solo para la
// familia del usuario (RLS). Se actualizan en vivo.
export function useComentarios(tipo, objetivoId) {
  const { tabla, columna } = TIPOS[tipo]
  const { usuario, familia } = useAuth()
  const userId = usuario?.id ?? null
  const familiaId = familia?.id ?? null
  const habilitado = Boolean(userId && familiaId && objetivoId)

  const [comentarios, setComentarios] = useState([])
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async () => {
    if (!habilitado) {
      setComentarios([])
      return
    }
    const { data } = await supabase
      .from(tabla)
      .select('id, texto, creado_en, autor_id, autor:perfiles(nombre, avatar_url)')
      .eq(columna, objetivoId)
      .order('creado_en', { ascending: true })
    setComentarios(data ?? [])
  }, [habilitado, tabla, columna, objetivoId])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    cargar().finally(() => {
      if (!cancelado) setCargando(false)
    })
    return () => {
      cancelado = true
    }
  }, [cargar, familiaId])

  useEffect(() => {
    if (!habilitado) return
    const canal = supabase
      .channel(`${tabla}-${objetivoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tabla, filter: `${columna}=eq.${objetivoId}` }, cargar)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: tabla }, cargar)
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [habilitado, tabla, columna, objetivoId, cargar])

  const agregar = useCallback(
    async (texto) => {
      const fila = { [columna]: objetivoId, autor_id: userId, texto: texto.trim() }
      if (tipo === 'receta') fila.familia_id = familiaId
      const { error } = await supabase.from(tabla).insert(fila)
      if (error) throw error
      await cargar()
    },
    [tipo, tabla, columna, objetivoId, userId, familiaId, cargar]
  )

  const borrar = useCallback(
    async (id) => {
      setComentarios((actuales) => actuales.filter((c) => c.id !== id))
      const { error } = await supabase.from(tabla).delete().eq('id', id)
      if (error) await cargar()
    },
    [tabla, cargar]
  )

  return { comentarios, cargando, habilitado, agregar, borrar }
}
