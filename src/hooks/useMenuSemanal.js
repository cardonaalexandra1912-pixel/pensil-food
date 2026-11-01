import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { fechaISO } from '../utils/fechas'

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function menuVacio() {
  return DIAS_SEMANA.map(() => ({ desayuno: null, almuerzo: null, cena: null }))
}

// Menú compartido de la familia para la semana que empieza en `lunes`.
// Vive en Supabase (menus_semanales + menu_items) y se actualiza en vivo:
// si otro integrante cambia una comida, aquí se ve sin recargar.
export function useMenuSemanal(lunes) {
  const { usuario, familia } = useAuth()
  const userId = usuario?.id ?? null
  const familiaId = familia?.id ?? null
  const fecha = fechaISO(lunes)

  const [menuId, setMenuId] = useState(null)
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarItems = useCallback(async (id) => {
    const { data, error: errorConsulta } = await supabase
      .from('menu_items')
      .select('id, dia, momento, receta_id, elegido_por, actualizado_en, elegido:perfiles(nombre, avatar_url)')
      .eq('menu_id', id)
    if (errorConsulta) {
      setError('No pudimos cargar el menú.')
      return
    }
    setItems(data)
  }, [])

  // Obtiene (o crea) el menú de la semana y sus comidas.
  useEffect(() => {
    if (!familiaId) {
      setMenuId(null)
      setItems([])
      setCargando(false)
      return
    }
    let cancelado = false
    async function cargar() {
      setCargando(true)
      setError('')
      const { data, error: errorRpc } = await supabase.rpc('obtener_menu_semana', { p_fecha: fecha })
      if (cancelado) return
      if (errorRpc || !data) {
        setError('No pudimos cargar el menú de esta semana.')
        setCargando(false)
        return
      }
      setMenuId(data.id)
      await cargarItems(data.id)
      if (!cancelado) setCargando(false)
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [familiaId, fecha, cargarItems])

  // Cambios en vivo de los demás integrantes.
  useEffect(() => {
    if (!menuId) return
    const canal = supabase
      .channel(`menu-items-${menuId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `menu_id=eq.${menuId}` },
        () => cargarItems(menuId)
      )
      // Los DELETE no se pueden filtrar por columna: recargamos ante cualquiera.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'menu_items' }, () =>
        cargarItems(menuId)
      )
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [menuId, cargarItems])

  // menu[indiceDia][momento] -> item (con receta_id y quién lo eligió) o null
  const menu = useMemo(() => {
    const base = menuVacio()
    items.forEach((item) => {
      if (base[item.dia]) base[item.dia][item.momento] = item
    })
    return base
  }, [items])

  const seleccionarReceta = useCallback(
    async (dia, momento, recetaId) => {
      if (!menuId || !userId) return
      setError('')
      const anterior = items
      if (!recetaId) {
        setItems((actuales) => actuales.filter((i) => !(i.dia === dia && i.momento === momento)))
        const { error: errorBorrar } = await supabase
          .from('menu_items')
          .delete()
          .eq('menu_id', menuId)
          .eq('dia', dia)
          .eq('momento', momento)
        if (errorBorrar) {
          setItems(anterior)
          setError('No se pudo quitar la comida. Intenta de nuevo.')
        }
        return
      }
      setItems((actuales) => [
        ...actuales.filter((i) => !(i.dia === dia && i.momento === momento)),
        { id: `temporal-${dia}-${momento}`, dia, momento, receta_id: Number(recetaId), elegido_por: userId, elegido: null },
      ])
      const { error: errorGuardar } = await supabase.from('menu_items').upsert(
        {
          menu_id: menuId,
          dia,
          momento,
          receta_id: Number(recetaId),
          elegido_por: userId,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: 'menu_id,dia,momento' }
      )
      if (errorGuardar) {
        setItems(anterior)
        setError('No se pudo guardar la comida. Intenta de nuevo.')
        return
      }
      cargarItems(menuId)
    },
    [menuId, userId, items, cargarItems]
  )

  const limpiarMenu = useCallback(async () => {
    if (!menuId) return
    const anterior = items
    setItems([])
    const { error: errorBorrar } = await supabase.from('menu_items').delete().eq('menu_id', menuId)
    if (errorBorrar) {
      setItems(anterior)
      setError('No se pudo limpiar la semana.')
    }
  }, [menuId, items])

  return { menuId, menu, cargando, error, seleccionarReceta, limpiarMenu }
}
