import { useEffect, useState } from 'react'

// Clave con la que guardamos los favoritos en el localStorage del navegador
const CLAVE_STORAGE = 'mis-recetas:favoritos'

// Hook personalizado que maneja la lista de ids de recetas favoritas.
// Se guarda en localStorage para que la lista no se pierda al recargar la página.
export function useFavoritos() {
  const [favoritos, setFavoritos] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE)
      return guardado ? JSON.parse(guardado) : []
    } catch {
      // Si algo sale mal leyendo localStorage (por ejemplo, datos corruptos),
      // simplemente empezamos con una lista vacía.
      return []
    }
  })

  // Cada vez que cambia la lista de favoritos, la volvemos a guardar
  useEffect(() => {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(favoritos))
  }, [favoritos])

  function esFavorito(id) {
    return favoritos.includes(id)
  }

  // Si la receta ya es favorita la quita, si no lo es la agrega
  function alternarFavorito(id) {
    setFavoritos((actuales) =>
      actuales.includes(id)
        ? actuales.filter((idGuardado) => idGuardado !== id)
        : [...actuales, id]
    )
  }

  return { favoritos, esFavorito, alternarFavorito }
}
