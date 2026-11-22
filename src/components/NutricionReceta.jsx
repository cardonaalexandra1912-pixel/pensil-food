import { useMemo } from 'react'
import { useRecetas } from '../context/RecetasContext'
import { NUTRIENTES, nutricionDeReceta } from '../utils/nutricion'
import './NutricionReceta.css'

// De dónde salen las calorías: 4 kcal por gramo de proteína y de
// carbohidratos, 9 por gramo de grasa.
const FUENTES = [
  { clave: 'proteina', etiqueta: 'Proteína', kcalPorGramo: 4 },
  { clave: 'carbohidratos', etiqueta: 'Carbohidratos', kcalPorGramo: 4 },
  { clave: 'grasa', etiqueta: 'Grasa', kcalPorGramo: 9 },
]

function redondear(valor) {
  return valor >= 10 ? Math.round(valor) : Math.round(valor * 10) / 10
}

// Cuánto aporta una porción de la receta. Calculado con el catálogo de
// productos (src/utils/nutricion.js): es aproximado y no cuenta lo «al gusto».
function NutricionReceta({ receta }) {
  const { productos } = useRecetas()
  const nutricion = useMemo(() => nutricionDeReceta(receta, productos), [receta, productos])
  const { porPorcion, medidos, sinDatos } = nutricion

  // Sin catálogo todavía (cargando) o sin nada que medir: no se muestra.
  if (!productos?.length || medidos === 0 || sinDatos.length === medidos) return null

  const kcalFuentes = FUENTES.map((f) => ({ ...f, kcal: porPorcion[f.clave] * f.kcalPorGramo }))
  const totalFuentes = kcalFuentes.reduce((suma, f) => suma + f.kcal, 0) || 1
  const kcal = Math.round(porPorcion.kcal / 10) * 10

  return (
    <section className="nutricion-receta" aria-labelledby="titulo-nutricion">
      <h2 id="titulo-nutricion">Nutrición por porción</h2>
      <p className="nutricion-kcal">
        <strong>{kcal.toLocaleString('es-CO')}</strong> kcal
      </p>

      <div
        className="nutricion-barra"
        role="img"
        aria-label={
          kcalFuentes.map((f) => `${f.etiqueta} ${Math.round((f.kcal / totalFuentes) * 100)} %`).join(', ') +
          ' de las calorías'
        }
      >
        {kcalFuentes.map((f) => (
          <span key={f.clave} className={`nutricion-barra-${f.clave}`} style={{ flexGrow: f.kcal }} />
        ))}
      </div>

      <dl className="nutricion-lista">
        {NUTRIENTES.map(({ clave, etiqueta, unidad }) => {
          const fuente = kcalFuentes.find((f) => f.clave === clave)
          return (
            <div key={clave}>
              <dt>
                {fuente && <span className={`nutricion-punto nutricion-barra-${clave}`} aria-hidden="true" />}
                {etiqueta}
              </dt>
              <dd>
                {redondear(porPorcion[clave])} {unidad}
                {fuente && <span> · {Math.round((fuente.kcal / totalFuentes) * 100)} %</span>}
              </dd>
            </div>
          )
        })}
      </dl>

      <p className="nutricion-nota">
        Aproximado, calculado con los ingredientes crudos de la receta. No cuenta lo que va al gusto.
        {sinDatos.length > 0 && ` Falta el dato de: ${sinDatos.join(', ')}.`}
      </p>
    </section>
  )
}

export default NutricionReceta
