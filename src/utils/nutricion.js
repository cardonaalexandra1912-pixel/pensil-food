// ============================================================================
// NUTRICIÓN DE LAS RECETAS
// ----------------------------------------------------------------------------
// Cada producto del catálogo trae (tabla public.productos):
//   nutricion  por 100 g: kcal, proteina, carbohidratos, grasa, fibra, azucar
//   gramos     cuánto pesa cada medida de las recetas: {"diente": 4, "taza": 185}
// Con el mismo reconocedor de la lista de mercado se sabe qué producto es cada
// ingrediente; se pasa a gramos, se suma y se divide por las porciones.
//
// Son valores aproximados (Tabla de Composición de Alimentos Colombianos del
// ICBF y USDA), de alimento crudo. Lo que va «al gusto» no se cuenta.
// ============================================================================

import { crearReconocedor, unidadNormal } from './listaMercado'

export const NUTRIENTES = [
  { clave: 'proteina', etiqueta: 'Proteína', unidad: 'g' },
  { clave: 'carbohidratos', etiqueta: 'Carbohidratos', unidad: 'g' },
  { clave: 'grasa', etiqueta: 'Grasa', unidad: 'g' },
  { clave: 'fibra', etiqueta: 'Fibra', unidad: 'g' },
  { clave: 'azucar', etiqueta: 'Azúcar', unidad: 'g' },
]

const CLAVES = ['kcal', ...NUTRIENTES.map((n) => n.clave)]

function gramosDe(producto, cantidad, unidad) {
  if (unidad === 'g') return cantidad
  if (unidad === 'kg') return cantidad * 1000
  if (unidad === 'lb') return cantidad * 453.6
  const peso = producto.gramos?.[unidad]
  return peso != null ? cantidad * Number(peso) : null
}

// Lo que la OMS cuenta como «frutas y verduras» deja fuera los tubérculos y
// el plátano, que son almidón (como el arroz).
const FECULENTOS = new Set(['Papa pastusa', 'Papa criolla', 'Yuca', 'Plátano verde', 'Plátano maduro', 'Batata'])
const SECCIONES_FRUTAS_VERDURAS = new Set(['Frutas y verduras', 'Congelados'])
// Azúcar que se le agrega a la comida (no la que traen la fruta o la leche).
const AZUCARES_ANADIDOS = new Set(['Azúcar', 'Miel', 'Panela', 'Cola granulada', 'Chocolate de mesa'])

function esFrutaOVerdura(producto) {
  return (
    SECCIONES_FRUTAS_VERDURAS.has(producto.seccion) &&
    !FECULENTOS.has(producto.nombre) &&
    producto.nombre !== 'Papas a la francesa'
  )
}

// Además de los nutrientes, cada receta cuenta gramos de frutas y verduras y
// gramos de azúcar añadida, para el resumen de la semana.
const EXTRAS = ['frutasVerduras', 'azucarAnadida']

function vacio() {
  return Object.fromEntries([...CLAVES, ...EXTRAS].map((clave) => [clave, 0]))
}

// Devuelve { porPorcion, total, medidos, sinDatos } para una receta.
// medidos: ingredientes con cantidad; sinDatos: los que no se pudieron calcular.
export function nutricionDeReceta(receta, productos, reconocer = crearReconocedor(productos ?? [])) {
  const total = vacio()
  const sinDatos = []
  let medidos = 0

  ;(receta.ingredientes ?? []).forEach((ingrediente) => {
    if (ingrediente.cantidadBase == null) return
    medidos += 1
    const [encontrado] = reconocer(ingrediente)
    const producto = encontrado?.producto
    if (producto?.se_compra === false) return // agua, hielo: no aportan
    const gramos = producto?.nutricion
      ? gramosDe(producto, Number(ingrediente.cantidadBase), unidadNormal(ingrediente.unidad))
      : null
    if (gramos == null || !Number.isFinite(gramos)) {
      sinDatos.push(ingrediente.nombre)
      return
    }
    CLAVES.forEach((clave) => {
      total[clave] += (Number(producto.nutricion[clave]) || 0) * (gramos / 100)
    })
    if (esFrutaOVerdura(producto)) total.frutasVerduras += gramos
    if (AZUCARES_ANADIDOS.has(producto.nombre)) {
      total.azucarAnadida += (Number(producto.nutricion.azucar) || 0) * (gramos / 100)
    }
  })

  const porciones = Number(receta.porciones) || 1
  const porPorcion = Object.fromEntries([...CLAVES, ...EXTRAS].map((clave) => [clave, total[clave] / porciones]))
  return { porPorcion, total, medidos, sinDatos }
}

// Referencias para una persona adulta (OMS): sirven de guía, no de meta
// personal. Las metas de cada quien llegan con su perfil.
export const REFERENCIAS = {
  proteinaPorComida: 20, // g en almuerzo y cena
  frutasVerduras: 400, // g al día
  fibra: 25, // g al día
  azucarAnadida: 25, // g al día, como máximo
}

const MOMENTOS_PRINCIPALES = ['almuerzo', 'cena']

// Resumen de la semana para una persona (una porción de cada receta).
// menu: menu[dia][momento] = [items con receta_id].
// Devuelve { dias: [{ kcal, proteina, ... } | null], promedio, diasPlaneados,
//            comidasConProteina, comidasPrincipales }.
export function resumenDelMenu(menu, recetaPorId, productos) {
  const reconocer = crearReconocedor(productos ?? [])
  const cache = new Map()
  function porPorcion(receta) {
    if (!cache.has(receta.id)) cache.set(receta.id, nutricionDeReceta(receta, productos, reconocer).porPorcion)
    return cache.get(receta.id)
  }

  let comidasConProteina = 0
  let comidasPrincipales = 0

  const dias = menu.map((dia) => {
    const suma = vacio()
    let recetas = 0
    Object.entries(dia).forEach(([momento, items]) => {
      const comida = vacio()
      items.forEach((item) => {
        const receta = recetaPorId(item.receta_id)
        if (!receta) return
        recetas += 1
        const valores = porPorcion(receta)
        Object.keys(comida).forEach((clave) => {
          comida[clave] += valores[clave] || 0
        })
      })
      if (MOMENTOS_PRINCIPALES.includes(momento) && items.length > 0) {
        comidasPrincipales += 1
        if (comida.proteina >= REFERENCIAS.proteinaPorComida) comidasConProteina += 1
      }
      Object.keys(suma).forEach((clave) => {
        suma[clave] += comida[clave]
      })
    })
    return recetas > 0 ? suma : null
  })

  const planeados = dias.filter(Boolean)
  const promedio = vacio()
  planeados.forEach((dia) => {
    Object.keys(promedio).forEach((clave) => {
      promedio[clave] += dia[clave] / planeados.length
    })
  })

  return { dias, promedio, diasPlaneados: planeados.length, comidasConProteina, comidasPrincipales }
}
