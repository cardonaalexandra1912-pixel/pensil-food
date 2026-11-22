// ============================================================================
// LISTA DE MERCADO POR PRODUCTO
// ----------------------------------------------------------------------------
// Las recetas dicen "3 dientes de ajo picado" o "2 cdas de aceite", pero en el
// mercado se compra "1 cabeza de ajo" y el aceite ya está en la alacena. Este
// módulo traduce lo uno a lo otro con el catálogo de productos (tabla
// public.productos en Supabase):
//
// 1. Reconoce a qué producto se refiere cada ingrediente por sus alias
//    ("ajo picado", "ajo machacado" y "ajo" son el producto Ajo). Así las
//    recetas nuevas quedan enlazadas solas, sin elegir nada al escribirlas.
// 2. Suma por producto y pasa a la unidad en que se compra con las
//    equivalencias del producto (1 diente = 0.1 cabeza) y redondea hacia
//    arriba a lo que se puede comprar (media libra, una unidad entera).
// 3. Separa lo de despensa (sal, aceite, especias), que casi siempre hay en
//    casa, para revisar antes de salir en vez de comprarlo cada semana.
//
// Lo que no se reconoce queda en "Otros" tal como está en la receta, para que
// nunca se pierda nada de la lista.
// ============================================================================

import { agruparIngredientes, formatCantidad } from './ingredientes'

// Orden de los pasillos: como se recorre una plaza o un supermercado.
export const SECCIONES_MERCADO = [
  'Frutas y verduras',
  'Carnes, pollo y pescado',
  'Lácteos y huevos',
  'Granos, arroz y pastas',
  'Panadería',
  'Congelados',
  'Despensa',
]

export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Unidades de las recetas llevadas a una sola forma ("tazas" -> "taza").
const UNIDADES = {
  '': 'unidad', unidad: 'unidad', unidades: 'unidad',
  lb: 'lb', libra: 'lb', libras: 'lb',
  g: 'g', gr: 'g', gramo: 'g', gramos: 'g',
  kg: 'kg', kilo: 'kg', kilos: 'kg',
  taza: 'taza', tazas: 'taza',
  cda: 'cda', cdas: 'cda', cucharada: 'cda', cucharadas: 'cda',
  cdta: 'cdta', cdtas: 'cdta', cucharadita: 'cdta', cucharaditas: 'cdta',
  diente: 'diente', dientes: 'diente',
  tallo: 'tallo', tallos: 'tallo', rama: 'tallo', ramas: 'tallo',
  filete: 'filete', filetes: 'filete',
  rebanada: 'rebanada', rebanadas: 'rebanada',
  tajada: 'tajada', tajadas: 'tajada',
  rodaja: 'rodaja', rodajas: 'rodaja',
  pastilla: 'pastilla', pastillas: 'pastilla',
  ramita: 'ramita', ramitas: 'ramita',
  trocito: 'trocito', trocitos: 'trocito',
  pechuga: 'pechuga', pechugas: 'pechuga',
  lata: 'lata', latas: 'lata',
  bolsa: 'bolsa', bolsas: 'bolsa',
  punado: 'puñado', punados: 'puñado',
}

function unidadNormal(unidad) {
  const u = normalizar(unidad).replace(/\.$/, '')
  return UNIDADES[u] ?? u
}

// Cuánto de la unidad de compra es una unidad de la receta (null si no se sabe).
function equivalencia(producto, unidad) {
  const compra = producto.unidad_compra
  if (unidad === compra) return 1
  const eq = producto.equivalencias?.[unidad]
  if (eq != null) return Number(eq)
  if (compra === 'lb' && unidad === 'g') return 1 / 453.6
  if (compra === 'lb' && unidad === 'kg') return 2.2046
  return null
}

// Palabras de adorno al comienzo que no dicen qué producto es.
const PREFIJOS = ['una pizca de ', 'unas gotas de ', 'hojitas de ', 'hojas de ', 'de ']

function quitarPrefijos(texto) {
  let resultado = texto
  let cambio = true
  while (cambio) {
    cambio = false
    for (const prefijo of PREFIJOS) {
      if (resultado.startsWith(prefijo)) {
        resultado = resultado.slice(prefijo.length)
        cambio = true
      }
    }
  }
  return resultado
}

// Primera opción de un texto: "arándanos o moras (frescos)" -> "arándanos".
function primeraOpcion(texto) {
  return texto.split(/,|\(|\so\s|\sy\s/)[0].trim()
}

// Prepara el reconocedor una vez por catálogo: los alias más largos primero,
// para que "ajo en polvo" gane sobre "ajo" y "leche de coco" sobre "leche".
export function crearReconocedor(productos) {
  const alias = productos
    .flatMap((producto) => (producto.alias ?? []).map((a) => ({ alias: normalizar(a), producto })))
    .sort((a, b) => b.alias.length - a.alias.length)

  function buscar(parte) {
    const texto = quitarPrefijos(normalizar(parte))
    if (!texto) return null
    for (const { alias: a, producto } of alias) {
      // El alias tiene que ser la palabra completa (con plural): "ajo" no es "ajonjolí".
      for (const terminacion of ['', 's', 'es']) {
        const palabra = a + terminacion
        if (texto === palabra || texto.startsWith(`${palabra} `)) return producto
      }
    }
    return null
  }

  // Devuelve [{ producto, cantidad, unidad }] o [] si no lo reconoce.
  // "Sal, pimienta y perejil al gusto" son tres productos sin cantidad.
  return function reconocer(ingrediente) {
    const nombre = quitarPrefijos(normalizar(ingrediente.nombre))
    if (ingrediente.cantidadBase == null) {
      const partes = nombre
        .replace(/\(.*?\)/g, '')
        .split(/,|\sy\s/)
        .map((parte) => primeraOpcion(quitarPrefijos(parte.trim())))
        .filter(Boolean)
      const encontrados = []
      partes.forEach((parte) => {
        const producto = buscar(parte)
        if (producto && !encontrados.some((e) => e.producto.id === producto.id)) {
          encontrados.push({ producto, cantidad: null, unidad: null })
        }
      })
      // Si alguna parte no se reconoce, mejor dejar la línea entera en "Otros".
      return encontrados.length === partes.length ? encontrados : []
    }
    const producto = buscar(primeraOpcion(nombre))
    return producto
      ? [{ producto, cantidad: Number(ingrediente.cantidadBase), unidad: unidadNormal(ingrediente.unidad) }]
      : []
  }
}

// Redondea hacia arriba a lo que se puede comprar.
function cantidadDeCompra(total, unidadCompra) {
  if (unidadCompra === 'lb') return Math.max(0.5, Math.ceil(total * 2 - 1e-9) / 2)
  return Math.max(1, Math.ceil(total - 1e-9))
}

// 0.5 -> "½", 2.5 -> "2½": así se pide en la plaza.
function textoNumero(cantidad) {
  const entero = Math.floor(cantidad)
  if (Math.abs(cantidad - entero - 0.5) < 1e-9) return entero === 0 ? '½' : `${entero}½`
  return formatCantidad(cantidad)
}

function textoUnidad(cantidad, producto) {
  if (producto.unidad_compra === 'unidad') return textoNumero(cantidad)
  const unidad = cantidad > 1 ? producto.unidad_compra_plural || producto.unidad_compra : producto.unidad_compra
  return `${textoNumero(cantidad)} ${unidad}`
}

// recetas: las recetas del menú (con repeticiones si se cocinan dos veces).
// Devuelve { secciones: [{ nombre, items }], despensa, otros, totalPorComprar }.
// Cada item: { id, nombre, cantidad, recetas } (cantidad es texto o '').
export function armarListaMercado(recetas, productos) {
  const reconocer = crearReconocedor(productos ?? [])
  const porProducto = new Map()
  const sinReconocer = []

  recetas.forEach((receta) => {
    ;(receta.ingredientes ?? []).forEach((ingrediente) => {
      const encontrados = reconocer(ingrediente)
      if (encontrados.length === 0) {
        sinReconocer.push({ ...ingrediente, receta: receta.nombre })
        return
      }
      encontrados.forEach(({ producto, cantidad, unidad }) => {
        if (producto.se_compra === false) return
        if (!porProducto.has(producto.id)) {
          porProducto.set(producto.id, { producto, total: 0, sueltos: new Map(), recetas: new Set() })
        }
        const grupo = porProducto.get(producto.id)
        grupo.recetas.add(receta.nombre)
        if (cantidad == null || !Number.isFinite(cantidad)) return
        const eq = equivalencia(producto, unidad)
        if (eq != null) grupo.total += cantidad * eq
        else grupo.sueltos.set(unidad, (grupo.sueltos.get(unidad) || 0) + cantidad)
      })
    })
  })

  const secciones = new Map(SECCIONES_MERCADO.map((nombre) => [nombre, []]))
  const despensa = []

  porProducto.forEach(({ producto, total, sueltos, recetas: usadas }) => {
    const item = {
      id: `p${producto.id}`,
      nombre: producto.nombre,
      recetas: [...usadas],
      cantidad: '',
    }
    if (producto.despensa) {
      despensa.push(item)
      return
    }
    const partes = []
    if (total > 0 || sueltos.size === 0) partes.push(textoUnidad(cantidadDeCompra(total, producto.unidad_compra), producto))
    sueltos.forEach((cantidad, unidad) =>
      partes.push(unidad === 'unidad' ? formatCantidad(cantidad) : `${formatCantidad(cantidad)} ${unidad}`)
    )
    item.cantidad = partes.join(' + ')
    if (!secciones.has(producto.seccion)) secciones.set(producto.seccion, [])
    secciones.get(producto.seccion).push(item)
  })

  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')
  const otros = agruparIngredientes(sinReconocer).map((item) => ({
    id: `o|${item.claveNombre}|${item.texto}`,
    nombre: item.texto,
    cantidad: !item.esNumerico && item.veces > 1 ? `×${item.veces}` : '',
    recetas: [],
  }))

  const listaSecciones = [...secciones.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([nombre, items]) => ({ nombre, items: items.sort(porNombre) }))

  return {
    secciones: listaSecciones,
    despensa: despensa.sort(porNombre),
    otros,
    totalPorComprar: listaSecciones.reduce((total, s) => total + s.items.length, 0) + otros.length,
  }
}
