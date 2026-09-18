import { useEffect, useState } from 'react'

const CLAVE_STORAGE = 'mis-recetas:menu-semanal'

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

// Estructura inicial: cada día empieza sin receta seleccionada para desayuno, almuerzo ni cena
function menuVacio() {
  const menu = {}
  DIAS_SEMANA.forEach((dia) => {
    menu[dia] = { desayuno: '', almuerzo: '', cena: '' }
  })
  return menu
}

// Hook personalizado que guarda las recetas elegidas para cada día de la semana.
// También persiste en localStorage para no perder el plan al recargar la página.
export function useMenuSemanal() {
  const [menu, setMenu] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE)
      const datosGuardados = guardado ? JSON.parse(guardado) : null
      const base = menuVacio()
      if (datosGuardados) {
        // Merge por día (no reemplazo directo) para no perder el campo "desayuno"
        // en planes guardados antes de que existiera esta opción.
        DIAS_SEMANA.forEach((dia) => {
          if (datosGuardados[dia]) {
            base[dia] = { ...base[dia], ...datosGuardados[dia] }
          }
        })
      }
      return base
    } catch {
      return menuVacio()
    }
  })

  useEffect(() => {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(menu))
  }, [menu])

  // tipoComida es 'desayuno', 'almuerzo' o 'cena', recetaId es el id elegido (string del <select>)
  function seleccionarReceta(dia, tipoComida, recetaId) {
    setMenu((actual) => ({
      ...actual,
      [dia]: { ...actual[dia], [tipoComida]: recetaId },
    }))
  }

  function limpiarMenu() {
    setMenu(menuVacio())
  }

  return { menu, seleccionarReceta, limpiarMenu }
}
