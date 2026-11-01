// ============================================================================
// CATÁLOGO: CATEGORÍAS, DIFICULTADES Y FORMA DE UNA RECETA
// ----------------------------------------------------------------------------
// Las recetas ya no viven aquí: están en Supabase (tabla public.recetas). El
// catálogo inicial que antes estaba escrito a mano en este archivo se cargó
// con supabase/migrations/20261101000002_recetas_iniciales.sql.
//
// Cada ingrediente es { cantidadBase, unidad, nombre }: cantidadBase y unidad
// se usan para escalar la cantidad según las porciones elegidas en el detalle
// de la receta (ver src/utils/ingredientes.js). Cuando un ingrediente no tiene
// una cantidad medible (ej. "Sal al gusto"), cantidadBase es null y se muestra
// tal cual, sin escalar.
// ============================================================================

// Lista de categorías disponibles. Se usa en los menús desplegables (selects)
// de toda la app, así que si agregas una categoría nueva, solo tienes que
// añadirla aquí y agregar recetas con ese mismo nombre en `categoria`.
export const CATEGORIAS = [
  'Desayunos',
  'Almuerzos',
  'Cenas',
  'Sopas y Cremas',
  'Huevos',
  'Ensaladas',
  'Comidas Caseras',
  'Jugos y Bebidas',
]

// Niveles de dificultad posibles para una receta.
export const DIFICULTADES = ['Fácil', 'Media', 'Difícil']

// Ícono por categoría, usado como fallback cuando a una receta todavía
// no le hemos puesto una foto real en public/imagenes/recetas/.
export const ICONOS_CATEGORIA = {
  Desayunos: '🥐',
  Almuerzos: '🍛',
  Cenas: '🌙',
  'Sopas y Cremas': '🍲',
  Huevos: '🥚',
  Ensaladas: '🥗',
  'Comidas Caseras': '🏠',
  'Jugos y Bebidas': '🥤',
}

// Momentos del día que se planean en el menú semanal.
export const MOMENTOS = [
  { clave: 'desayuno', etiqueta: 'Desayuno' },
  { clave: 'almuerzo', etiqueta: 'Almuerzo' },
  { clave: 'cena', etiqueta: 'Cena' },
]

// Las imágenes del catálogo se guardan como ruta relativa a public/
// ("imagenes/recetas/1.jpg"); las recetas nuevas pueden traer una URL completa.
function resolverImagen(ruta) {
  if (!ruta) return null
  if (/^https?:\/\//i.test(ruta)) return ruta
  return `${import.meta.env.BASE_URL}${ruta.replace(/^\//, '')}`
}

// Convierte una fila de public.recetas a la forma que usa toda la app.
export function recetaDesdeDb(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    imagen: resolverImagen(fila.imagen),
    imagenOriginal: fila.imagen || '',
    descripcion: fila.descripcion,
    tiempoPreparacion: fila.tiempo_preparacion,
    porciones: fila.porciones,
    dificultad: fila.dificultad,
    ingredientes: fila.ingredientes || [],
    pasos: fila.pasos || [],
    familiaId: fila.familia_id,
    creadaPor: fila.creada_por,
  }
}

// Convierte los campos del formulario de receta a una fila de public.recetas.
export function recetaHaciaDb(receta) {
  return {
    nombre: receta.nombre.trim(),
    categoria: receta.categoria,
    imagen: receta.imagen?.trim() || null,
    descripcion: receta.descripcion.trim(),
    tiempo_preparacion: Number(receta.tiempoPreparacion) || 0,
    porciones: Number(receta.porciones) || 1,
    dificultad: receta.dificultad,
    ingredientes: receta.ingredientes,
    pasos: receta.pasos,
  }
}
