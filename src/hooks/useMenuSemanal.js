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

// Estructura inicial: cada día empieza sin receta seleccionada para almuerzo ni cena
function menuVacio() {
  const menu = {}
  DIAS_SEMANA.forEach((dia) => {
    menu[dia] = { almuerzo: '', cena: '' }
  })
  return menu
}

// Hook personalizado que guarda las recetas elegidas para cada día de la semana.
// También persiste en localStorage para no perder el plan al recargar la página.
export function useMenuSemanal() {
  const [menu, setMenu] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE)
      return guardado ? { ...menuVacio(), ...JSON.parse(guardado) } : menuVacio()
    } catch {
      return menuVacio()
    }
  })

  useEffect(() => {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(menu))
  }, [menu])

  // tipoComida es 'almuerzo' o 'cena', recetaId es el id elegido (string del <select>)
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
