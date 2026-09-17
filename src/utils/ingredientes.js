// ============================================================================
// UTILIDADES DE INGREDIENTES
// ----------------------------------------------------------------------------
// Cada ingrediente se guarda como { cantidadBase, unidad, nombre }. Cuando
// cantidadBase es null, es un ingrediente "al gusto" / sin cantidad medible
// (ej. "Sal y pimienta al gusto") y no se escala con las porciones.
// ============================================================================

// Redondea a máximo 2 decimales y quita ceros sobrantes (1.50 -> 1.5, 2.00 -> 2).
export function formatCantidad(numero) {
  const redondeado = Math.round(numero * 100) / 100
  return Number(redondeado.toFixed(2)).toString()
}

// Cantidad de un ingrediente ajustada a las porciones seleccionadas.
export function calcularCantidad(ingrediente, porcionesBase, porcionesSeleccionadas) {
  if (ingrediente.cantidadBase == null || !porcionesBase) return null
  return (ingrediente.cantidadBase / porcionesBase) * porcionesSeleccionadas
}

// Texto legible de un ingrediente para una cantidad de porciones dada.
export function formatIngrediente(ingrediente, porcionesBase, porcionesSeleccionadas) {
  if (ingrediente.cantidadBase == null) {
    return ingrediente.nombre
  }
  const cantidad = formatCantidad(calcularCantidad(ingrediente, porcionesBase, porcionesSeleccionadas))
  return ingrediente.unidad
    ? `${cantidad} ${ingrediente.unidad} de ${ingrediente.nombre}`
    : `${cantidad} ${ingrediente.nombre}`
}

// Normaliza texto para comparar ingredientes sin que importen mayúsculas,
// acentos o espacios extra ("Huevos", "huevos ", "HUEVOS" -> "huevos").
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

// Clave para agrupar: normaliza y además quita una "s" final, para que
// singular y plural cuenten como el mismo ingrediente/unidad
// ("huevo"/"huevos", "taza"/"tazas").
function claveAgrupacion(texto) {
  const normalizado = normalizarTexto(texto)
  return normalizado.length > 1 && normalizado.endsWith('s')
    ? normalizado.slice(0, -1)
    : normalizado
}

// Unidades que no cambian entre singular y plural (abreviaturas de peso/volumen).
const UNIDADES_INVARIABLES = new Set(['lb', 'oz', 'g', 'kg', 'ml', 'l'])

// Ajusta una unidad a singular o plural según el total ya sumado, para que al
// combinar cantidades no quede algo como "2 lata" en vez de "2 latas".
function ajustarUnidad(unidad, cantidadRedondeada) {
  if (!unidad) return unidad
  if (UNIDADES_INVARIABLES.has(unidad.toLowerCase())) return unidad
  const singular = unidad.length > 1 && unidad.endsWith('s') ? unidad.slice(0, -1) : unidad
  return cantidadRedondeada > 1 ? `${singular}s` : singular
}

// Junta una lista plana de ingredientes (típicamente de varias recetas) en una
// lista de mercado: suma las cantidades de los ingredientes que comparten el
// mismo nombre Y la misma unidad, y agrupa sin sumar los que no tienen una
// cantidad medible (los "al gusto"), evitando que se repitan. Si el mismo
// ingrediente aparece con unidades distintas (ej. "tazas" y "ml"), no se
// suman entre sí: quedan como líneas separadas, una junto a la otra gracias
// al orden alfabético. Devuelve la lista ya ordenada, lista para renderizar.
export function agruparIngredientes(listaIngredientes) {
  const grupos = new Map()

  listaIngredientes.forEach((ingrediente) => {
    const claveNombre = claveAgrupacion(ingrediente.nombre)
    const claveUnidad = claveAgrupacion(ingrediente.unidad || '')
    const clave = `${claveNombre}__${claveUnidad}`

    if (!grupos.has(clave)) {
      grupos.set(clave, {
        nombre: ingrediente.nombre,
        unidad: ingrediente.unidad,
        claveNombre,
        cantidad: ingrediente.cantidadBase == null ? null : 0,
        veces: 0,
      })
    }

    const grupo = grupos.get(clave)
    grupo.veces += 1
    if (ingrediente.cantidadBase != null && grupo.cantidad != null) {
      grupo.cantidad += ingrediente.cantidadBase
    }
  })

  return Array.from(grupos.values())
    .map((grupo) => {
      if (grupo.cantidad == null) {
        return { texto: grupo.nombre, veces: grupo.veces, esNumerico: false, claveNombre: grupo.claveNombre }
      }
      const cantidadRedondeada = Math.round(grupo.cantidad * 100) / 100
      const unidad = ajustarUnidad(grupo.unidad, cantidadRedondeada)
      const texto = unidad
        ? `${formatCantidad(cantidadRedondeada)} ${unidad} de ${grupo.nombre}`
        : `${formatCantidad(cantidadRedondeada)} ${grupo.nombre}`
      return { texto, veces: grupo.veces, esNumerico: true, claveNombre: grupo.claveNombre }
    })
    .sort((a, b) => a.claveNombre.localeCompare(b.claveNombre, 'es'))
}
