import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { fechaISO } from '../utils/fechas'

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function menuVacio() {
  return DIAS_SEMANA.map(() => ({ desayuno: [], almuerzo: [], cena: [] }))
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
      .select(
        'id, dia, momento, receta_id, elegido_por, actualizado_en, creado_en, elegido:perfiles(nombre, avatar_url)',
      )
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
        () => cargarItems(menuId),
      )
      // Los DELETE no se pueden filtrar por columna: recargamos ante cualquiera.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'menu_items' }, () => cargarItems(menuId))
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [menuId, cargarItems])

  // menu[indiceDia][momento] -> lista de platos de esa comida (cada uno con
  // receta_id y quién lo eligió), en el orden en que se agregaron. Una comida
  // puede tener varios, por ejemplo sopa y plato fuerte en el almuerzo.
  const menu = useMemo(() => {
    const base = menuVacio()
    ;[...items]
      .sort((a, b) => String(a.creado_en ?? '').localeCompare(String(b.creado_en ?? '')))
      .forEach((item) => {
        if (base[item.dia]) base[item.dia][item.momento].push(item)
      })
    return base
  }, [items])

  // Agrega una receta a una comida, junto a las que ya tenga.
  const agregarReceta = useCallback(
    async (dia, momento, recetaId) => {
      if (!menuId || !userId || !recetaId) return false
      const id = Number(recetaId)
      if (items.some((i) => i.dia === dia && i.momento === momento && i.receta_id === id)) return true
      setError('')
      const anterior = items
      setItems((actuales) => [
        ...actuales,
        {
          id: `temporal-${dia}-${momento}-${id}`,
          dia,
          momento,
          receta_id: id,
          elegido_por: userId,
          elegido: null,
          creado_en: new Date().toISOString(),
        },
      ])
      const { error: errorGuardar } = await supabase.from('menu_items').insert({
        menu_id: menuId,
        dia,
        momento,
        receta_id: id,
        elegido_por: userId,
      })
      if (errorGuardar) {
        setItems(anterior)
        setError('No se pudo guardar la comida. Intenta de nuevo.')
        return false
      }
      cargarItems(menuId)
      return true
    },
    [menuId, userId, items, cargarItems],
  )

  // Cambia un plato de una comida por otra receta (los demás platos quedan igual).
  const cambiarReceta = useCallback(
    async (itemId, recetaId) => {
      const item = items.find((i) => i.id === itemId)
      if (!menuId || !userId || !item || !recetaId) return false
      const id = Number(recetaId)
      if (item.receta_id === id) return true
      setError('')
      const anterior = items
      setItems((actuales) =>
        actuales.map((i) => (i.id === itemId ? { ...i, receta_id: id, elegido_por: userId, elegido: null } : i)),
      )
      const { error: errorGuardar } = await supabase
        .from('menu_items')
        .update({ receta_id: id, elegido_por: userId, actualizado_en: new Date().toISOString() })
        .eq('id', itemId)
      if (errorGuardar) {
        setItems(anterior)
        setError('No se pudo cambiar la comida. Intenta de nuevo.')
        return false
      }
      cargarItems(menuId)
      return true
    },
    [menuId, userId, items, cargarItems],
  )

  // Quita un plato de una comida.
  const quitarReceta = useCallback(
    async (itemId) => {
      if (!menuId) return false
      setError('')
      const anterior = items
      setItems((actuales) => actuales.filter((i) => i.id !== itemId))
      const { error: errorBorrar } = await supabase.from('menu_items').delete().eq('id', itemId)
      if (errorBorrar) {
        setItems(anterior)
        setError('No se pudo quitar la comida. Intenta de nuevo.')
        return false
      }
      return true
    },
    [menuId, items],
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

  // Copia las comidas de otra semana (la pasada) solo en las comidas que aquí
  // están libres: no pisa lo que ya eligió alguien. Una comida con sopa y
  // plato fuerte se copia completa. Devuelve cuántas comidas copió.
  const copiarSemana = useCallback(
    async (lunesOrigen) => {
      if (!menuId || !userId || !familiaId) return 0
      const { data: origen, error: errorOrigen } = await supabase
        .from('menus_semanales')
        .select('id')
        .eq('familia_id', familiaId)
        .eq('semana_inicio', fechaISO(lunesOrigen))
        .maybeSingle()
      if (errorOrigen) throw errorOrigen
      if (!origen) return 0

      const { data: comidas, error: errorComidas } = await supabase
        .from('menu_items')
        .select('dia, momento, receta_id, creado_en')
        .eq('menu_id', origen.id)
        .order('creado_en')
      if (errorComidas) throw errorComidas

      const ocupadas = new Set(items.map((i) => `${i.dia}-${i.momento}`))
      const filas = comidas
        .filter((c) => !ocupadas.has(`${c.dia}-${c.momento}`))
        .map((c) => ({
          menu_id: menuId,
          dia: c.dia,
          momento: c.momento,
          receta_id: c.receta_id,
          elegido_por: userId,
        }))
      if (filas.length === 0) return 0

      const { error: errorGuardar } = await supabase
        .from('menu_items')
        .upsert(filas, { onConflict: 'menu_id,dia,momento,receta_id', ignoreDuplicates: true })
      if (errorGuardar) throw errorGuardar
      await cargarItems(menuId)
      return new Set(filas.map((f) => `${f.dia}-${f.momento}`)).size
    },
    [menuId, userId, familiaId, items, cargarItems],
  )

  return { menuId, menu, cargando, error, agregarReceta, cambiarReceta, quitarReceta, limpiarMenu, copiarSemana }
}

// Recetas elegidas en la semana (7 días × 3 momentos, con todos los platos de
// cada comida), en el orden del menú. Una comida puede venir como lista de
// platos o como un solo plato (la semana de ejemplo de la portada).
export function recetasDelMenu(menu, recetaPorId) {
  return menu
    .flatMap((dia) => ['desayuno', 'almuerzo', 'cena'].flatMap((momento) => [].concat(dia[momento] ?? [])))
    .map((item) => recetaPorId(item.receta_id))
    .filter(Boolean)
}

// Cuántas comidas (desayuno, almuerzo o cena de un día) tienen al menos un plato.
export function contarComidasLlenas(menu) {
  return menu.reduce(
    (total, dia) => total + ['desayuno', 'almuerzo', 'cena'].filter((momento) => dia[momento]?.length > 0).length,
    0,
  )
}

// Cuántas comidas tiene el menú de otra semana (sin crearlo si no existe).
export async function contarComidasDeSemana(familiaId, lunes) {
  const { data: menu } = await supabase
    .from('menus_semanales')
    .select('id')
    .eq('familia_id', familiaId)
    .eq('semana_inicio', fechaISO(lunes))
    .maybeSingle()
  if (!menu) return 0
  const { data: comidas } = await supabase.from('menu_items').select('dia, momento').eq('menu_id', menu.id)
  return new Set((comidas ?? []).map((c) => `${c.dia}-${c.momento}`)).size
}

// Lee el menú de otra semana una sola vez (sin crearlo y sin cambios en vivo),
// con la misma forma que `menu` del hook: menu[dia][momento] = [platos].
export async function leerMenuDeSemana(familiaId, lunes) {
  const menu = menuVacio()
  const { data: semana } = await supabase
    .from('menus_semanales')
    .select('id')
    .eq('familia_id', familiaId)
    .eq('semana_inicio', fechaISO(lunes))
    .maybeSingle()
  if (!semana) return menu
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, dia, momento, receta_id, creado_en')
    .eq('menu_id', semana.id)
    .order('creado_en')
  if (error) throw error
  ;(items ?? []).forEach((item) => menu[item.dia]?.[item.momento]?.push(item))
  return menu
}
