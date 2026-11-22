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

function vacio() {
  return Object.fromEntries(CLAVES.map((clave) => [clave, 0]))
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
  })

  const porciones = Number(receta.porciones) || 1
  const porPorcion = Object.fromEntries(CLAVES.map((clave) => [clave, total[clave] / porciones]))
  return { porPorcion, total, medidos, sinDatos }
}
