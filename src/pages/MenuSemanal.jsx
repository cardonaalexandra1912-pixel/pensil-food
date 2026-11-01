import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Radio } from 'lucide-react'
import { CATEGORIAS, MOMENTOS } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useRecetas } from '../context/RecetasContext'
import { DIAS_SEMANA, useMenuSemanal } from '../hooks/useMenuSemanal'
import { agruparIngredientes } from '../utils/ingredientes'
import { descargarListaMercadoPdf } from '../utils/listaMercadoPdf'
import { desdeISO, fechaISO, lunesDe, sumarDias, textoSemana } from '../utils/fechas'
import AvisoSinFamilia from '../components/AvisoSinFamilia'
import Avatar from '../components/Avatar'
import Cargando from '../components/Cargando'
import Comentarios from '../components/Comentarios'
import EstadoVacio from '../components/EstadoVacio'
import './MenuSemanal.css'

// Página de Menú Semanal: el plan de la familia para una semana (lunes a
// domingo). Cualquier integrante elige desayuno, almuerzo y cena de cada día;
// los cambios se ven en vivo y la lista de mercado se arma sola.
function MenuSemanal() {
  const { familia } = useAuth()
  const [parametros, setParametros] = useSearchParams()

  // La semana se guarda en la URL (?semana=2026-11-02) para poder compartirla.
  const semanaURL = parametros.get('semana')
  const lunes = useMemo(
    () => lunesDe(semanaURL && /^\d{4}-\d{2}-\d{2}$/.test(semanaURL) ? desdeISO(semanaURL) : new Date()),
    [semanaURL]
  )
  const esSemanaActual = fechaISO(lunes) === fechaISO(lunesDe(new Date()))

  function irASemana(nuevoLunes) {
    const esActual = fechaISO(nuevoLunes) === fechaISO(lunesDe(new Date()))
    setParametros(esActual ? {} : { semana: fechaISO(nuevoLunes) })
  }

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <h1>Menú Semanal</h1>
          {familia && <span className="menu-semanal-familia">Plan de {familia.nombre}</span>}
        </div>

        {!familia ? (
          <AvisoSinFamilia mensaje="El menú semanal se planea en familia: todos eligen las comidas y comparten la lista de mercado." />
        ) : (
          <>
            <div className="menu-semanal-navegacion">
              <button
                type="button"
                className="menu-semanal-flecha"
                onClick={() => irASemana(sumarDias(lunes, -7))}
                aria-label="Semana anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="menu-semanal-semana">
                <strong>{textoSemana(lunes)}</strong>
                {esSemanaActual ? (
                  <span>Esta semana</span>
                ) : (
                  <button type="button" onClick={() => irASemana(lunesDe(new Date()))}>
                    Volver a esta semana
                  </button>
                )}
              </div>
              <button
                type="button"
                className="menu-semanal-flecha"
                onClick={() => irASemana(sumarDias(lunes, 7))}
                aria-label="Semana siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <PlanSemana key={fechaISO(lunes)} lunes={lunes} />
          </>
        )}
      </div>
    </div>
  )
}

function PlanSemana({ lunes }) {
  const { usuario } = useAuth()
  const { recetas, recetaPorId } = useRecetas()
  const { menuId, menu, cargando, error, seleccionarReceta, limpiarMenu } = useMenuSemanal(lunes)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  // El select de Desayuno solo muestra recetas de categoría "Desayunos".
  const recetasDesayuno = useMemo(() => recetas.filter((receta) => receta.categoria === 'Desayunos'), [recetas])

  // El resto de categorías (todo menos Desayunos) va como <optgroup> en los
  // selects de Almuerzo y Cena.
  const recetasPorCategoria = useMemo(
    () =>
      CATEGORIAS.filter((categoria) => categoria !== 'Desayunos')
        .map((categoria) => ({
          categoria,
          items: recetas.filter((receta) => receta.categoria === categoria),
        }))
        .filter((grupo) => grupo.items.length > 0),
    [recetas]
  )

  // Todas las recetas elegidas en la semana (7 días × 3 momentos)
  const recetasSeleccionadas = useMemo(
    () =>
      menu
        .flatMap((dia) => MOMENTOS.map(({ clave }) => dia[clave]?.receta_id))
        .filter(Boolean)
        .map((id) => recetaPorId(id))
        .filter(Boolean),
    [menu, recetaPorId]
  )

  // Lista de mercado: todos los ingredientes (a su cantidad base) agrupados por
  // nombre + unidad (ver agruparIngredientes en utils/ingredientes.js).
  const listaMercado = useMemo(
    () => agruparIngredientes(recetasSeleccionadas.flatMap((receta) => receta.ingredientes)),
    [recetasSeleccionadas]
  )

  async function descargarPdf() {
    const diasConRecetas = DIAS_SEMANA.map((dia, indice) => ({
      dia: `${dia} ${sumarDias(lunes, indice).getDate()}`,
      comidas: MOMENTOS.map(({ clave, etiqueta }) => ({
        momento: etiqueta,
        nombre: recetaPorId(menu[indice][clave]?.receta_id)?.nombre,
      })).filter((comida) => comida.nombre),
    })).filter((dia) => dia.comidas.length > 0)

    setGenerandoPdf(true)
    try {
      await descargarListaMercadoPdf(diasConRecetas, listaMercado)
    } finally {
      setGenerandoPdf(false)
    }
  }

  if (cargando) return <Cargando texto="Cargando el menú de la semana…" />

  function opcionesPara(momento) {
    if (momento === 'desayuno') {
      return recetasDesayuno.map((receta) => (
        <option key={receta.id} value={receta.id}>
          {receta.nombre}
        </option>
      ))
    }
    return recetasPorCategoria.map((grupo) => (
      <optgroup key={grupo.categoria} label={grupo.categoria}>
        {grupo.items.map((receta) => (
          <option key={receta.id} value={receta.id}>
            {receta.nombre}
          </option>
        ))}
      </optgroup>
    ))
  }

  return (
    <>
      <div className="menu-semanal-barra">
        <p className="menu-semanal-intro">
          <Radio size={16} aria-hidden="true" className="menu-semanal-envivo" />
          Lo que elija cualquier integrante de la familia aparece aquí al instante.
        </p>
        <button
          type="button"
          className="boton boton-contorno"
          onClick={() => {
            if (window.confirm('¿Quitar todas las comidas de esta semana para toda la familia?')) limpiarMenu()
          }}
          disabled={recetasSeleccionadas.length === 0}
        >
          Limpiar semana
        </button>
      </div>
      {error && <p className="mensaje-error menu-semanal-error">{error}</p>}

      {/* --- Grid de 7 días --- */}
      <div className="menu-semanal-grid">
        {DIAS_SEMANA.map((dia, indiceDia) => {
          const fechaDia = sumarDias(lunes, indiceDia)
          const esHoy = fechaISO(fechaDia) === fechaISO(new Date())
          return (
            <div key={dia} className={`dia-card ${esHoy ? 'es-hoy' : ''}`}>
              <h3>
                {dia} <span className="dia-card-fecha">{fechaDia.getDate()}</span>
                {esHoy && <span className="dia-card-hoy">Hoy</span>}
              </h3>

              {MOMENTOS.map(({ clave, etiqueta }) => {
                const item = menu[indiceDia][clave]
                const elegidoPorMi = item && item.elegido_por === usuario?.id
                const nombreQuien = elegidoPorMi ? 'ti' : item?.elegido?.nombre
                return (
                  <div key={clave} className="dia-card-comida">
                    <label className="dia-card-label" htmlFor={`${dia}-${clave}`}>
                      {etiqueta}
                    </label>
                    <select
                      id={`${dia}-${clave}`}
                      className="campo-formulario"
                      value={item?.receta_id ?? ''}
                      onChange={(e) => seleccionarReceta(indiceDia, clave, e.target.value)}
                    >
                      <option value="">Sin seleccionar</option>
                      {opcionesPara(clave)}
                    </select>
                    {item && nombreQuien && (
                      <span className="dia-card-quien">
                        <Avatar
                          nombre={item.elegido?.nombre}
                          url={item.elegido?.avatar_url}
                          tamano={18}
                        />
                        Elegido por {nombreQuien}
                        <Link to={`/recetas/${item.receta_id}`} className="dia-card-ver">
                          Ver
                        </Link>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* --- Lista de mercado --- */}
      <section className="lista-mercado">
        <div className="lista-mercado-encabezado">
          <h2>🛒 Lista de Mercado</h2>
          {listaMercado.length > 0 && (
            <button
              type="button"
              className="boton boton-primario lista-mercado-pdf"
              onClick={descargarPdf}
              disabled={generandoPdf}
            >
              <Download size={18} aria-hidden="true" />
              {generandoPdf ? 'Preparando PDF…' : 'Descargar PDF'}
            </button>
          )}
        </div>

        {listaMercado.length === 0 ? (
          <EstadoVacio
            icono="🛒"
            titulo="Aún no hay nada en la lista"
            mensaje="Elijan las comidas de la semana y aquí aparecerán automáticamente los ingredientes que necesitan comprar."
          />
        ) : (
          <ul className="lista-mercado-items">
            {listaMercado.map((item) => (
              <li key={`${item.claveNombre}|${item.texto}`}>
                <span>{item.texto}</span>
                {!item.esNumerico && item.veces > 1 && <span className="lista-mercado-cantidad">×{item.veces}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Comentarios
        tipo="menu"
        objetivoId={menuId}
        titulo="Conversación de la semana"
        descripcion="Propongan cambios, voten por su plato favorito o pónganse de acuerdo en quién cocina."
      />
    </>
  )
}

export default MenuSemanal
