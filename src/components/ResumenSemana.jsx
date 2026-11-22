import { REFERENCIAS } from '../utils/nutricion'
import './ResumenSemana.css'

function numero(valor) {
  return Math.round(valor).toLocaleString('es-CO')
}

// Un indicador: el valor, la referencia y una barra que se llena hasta ella.
// tipo «minimo»: más es mejor (llega a la referencia); «maximo»: no pasarse.
function Indicador({ titulo, valor, referencia, tipo, texto, detalle }) {
  const proporcion = referencia > 0 ? valor / referencia : 0
  const estado = tipo === 'maximo' ? (proporcion > 1 ? 'pasado' : 'bien') : proporcion >= 1 ? 'bien' : 'falta'
  return (
    <li className={`resumen-indicador resumen-${estado}`}>
      <div className="resumen-indicador-fila">
        <span className="resumen-indicador-titulo">{titulo}</span>
        <span className="resumen-indicador-valor">{texto}</span>
      </div>
      <span className="resumen-barra" aria-hidden="true">
        <span style={{ width: `${Math.min(proporcion, 1) * 100}%` }} />
      </span>
      <span className="resumen-indicador-detalle">{detalle}</span>
    </li>
  )
}

// «Cómo vamos esta semana»: lo que aporta el menú por persona, en promedio por
// día planeado, contra las referencias de la OMS para un adulto.
function ResumenSemana({ resumen }) {
  const { promedio, diasPlaneados, comidasConProteina, comidasPrincipales } = resumen
  if (diasPlaneados === 0) return null

  return (
    <section className="resumen-semana" aria-labelledby="resumen-semana-titulo">
      <h2 id="resumen-semana-titulo">Cómo vamos esta semana</h2>
      <p className="resumen-semana-nota">
        Por persona, en promedio en {diasPlaneados === 1 ? 'el día planeado' : `los ${diasPlaneados} días planeados`}.
        Solo cuenta lo que está en el menú.
      </p>

      <p className="resumen-semana-cifras">
        <span>
          <strong>{numero(promedio.kcal)}</strong> kcal al día
        </span>
        <span>
          <strong>{numero(promedio.proteina)} g</strong> de proteína
        </span>
      </p>

      <ul className="resumen-indicadores">
        {comidasPrincipales > 0 && (
          <Indicador
            titulo="Proteína en almuerzos y cenas"
            valor={comidasConProteina}
            referencia={comidasPrincipales}
            tipo="minimo"
            texto={`${comidasConProteina} de ${comidasPrincipales}`}
            detalle={`Con ${REFERENCIAS.proteinaPorComida} g o más por persona, lo que ayuda a sentirse lleno y a recuperarse del ejercicio.`}
          />
        )}
        <Indicador
          titulo="Frutas y verduras"
          valor={promedio.frutasVerduras}
          referencia={REFERENCIAS.frutasVerduras}
          tipo="minimo"
          texto={`${numero(promedio.frutasVerduras)} g al día`}
          detalle={`Referencia: ${REFERENCIAS.frutasVerduras} g al día. Papa, yuca y plátano no cuentan aquí: son almidón, como el arroz.`}
        />
        <Indicador
          titulo="Fibra"
          valor={promedio.fibra}
          referencia={REFERENCIAS.fibra}
          tipo="minimo"
          texto={`${numero(promedio.fibra)} g al día`}
          detalle={`Referencia: ${REFERENCIAS.fibra} g al día. Sube con fríjoles, lentejas, verduras y frutas enteras.`}
        />
        <Indicador
          titulo="Azúcar añadida"
          valor={promedio.azucarAnadida}
          referencia={REFERENCIAS.azucarAnadida}
          tipo="maximo"
          texto={`${numero(promedio.azucarAnadida)} g al día`}
          detalle={`Ideal: menos de ${REFERENCIAS.azucarAnadida} g al día. Cuenta el azúcar, la miel y la panela que se agregan a jugos y bebidas.`}
        />
      </ul>

      <p className="resumen-semana-nota">
        Referencias de la OMS para una persona adulta; las cifras son aproximadas. Las metas de cada uno llegarán con su
        perfil.
      </p>
    </section>
  )
}

export default ResumenSemana
