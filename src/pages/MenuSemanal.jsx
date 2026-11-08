import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Download, Repeat, Send, ShoppingBasket } from 'lucide-react'
import { MOMENTOS } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../lib/supabase'
import { useRecetas } from '../context/RecetasContext'
import { DIAS_SEMANA, contarComidasDeSemana, recetasDelMenu, useMenuSemanal } from '../hooks/useMenuSemanal'
import { agruparIngredientes } from '../utils/ingredientes'
import { descargarListaMercadoPdf } from '../utils/listaMercadoPdf'
import { desdeISO, fechaISO, indiceEnSemana, lunesDe, sumarDias, textoSemana } from '../utils/fechas'
import AvisoSinFamilia from '../components/AvisoSinFamilia'
import Cargando from '../components/Cargando'
import ComidaSlot from '../components/ComidaSlot'
import Comentarios from '../components/Comentarios'
import EstadoVacio from '../components/EstadoVacio'
import SelectorReceta from '../components/SelectorReceta'
import './MenuSemanal.css'

const COMIDAS_POR_SEMANA = DIAS_SEMANA.length * MOMENTOS.length

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
      <div className="contenedor seccion menu-semanal">
        <div className="menu-semanal-cabecera">
          <h1>Menú semanal</h1>
          {familia && <p>{familia.nombre}</p>}
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
                <ChevronLeft size={22} aria-hidden="true" />
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
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
            <PlanSemana key={fechaISO(lunes)} lunes={lunes} esSemanaActual={esSemanaActual} />
          </>
        )}
      </div>
    </div>
  )
}

function PlanSemana({ lunes, esSemanaActual }) {
  const { usuario, familia } = useAuth()
  const { recetaPorId } = useRecetas()
  const { hash } = useLocation()
  const { menuId, menu, cargando, error, seleccionarReceta, limpiarMenu, copiarSemana } = useMenuSemanal(lunes)
  const [diaActivo, setDiaActivo] = useState(esSemanaActual ? indiceEnSemana(new Date()) : 0)
  const [eligiendo, setEligiendo] = useState(null) // { dia, momento } mientras la hoja está abierta
  const [comidasSemanaPasada, setComidasSemanaPasada] = useState(0)
  const [copiando, setCopiando] = useState(false)
  const [aviso, setAviso] = useState('')
  const toqueRef = useRef(null)
  const lunesPasado = useMemo(() => sumarDias(lunes, -7), [lunes])

  // ¿Hay algo que repetir de la semana pasada?
  useEffect(() => {
    let cancelado = false
    contarComidasDeSemana(familia.id, lunesPasado).then((total) => {
      if (!cancelado) setComidasSemanaPasada(total)
    })
    return () => {
      cancelado = true
    }
  }, [familia.id, lunesPasado])

  const recetasSeleccionadas = useMemo(() => recetasDelMenu(menu, recetaPorId), [menu, recetaPorId])
  const listaMercado = useMemo(
    () => agruparIngredientes(recetasSeleccionadas.flatMap((receta) => receta.ingredientes)),
    [recetasSeleccionadas]
  )

  // Desde el inicio se puede llegar directo a la lista (/menu-semanal#lista-mercado).
  useEffect(() => {
    if (!cargando && hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [cargando, hash])

  if (cargando) return <Cargando texto="Cargando el menú de la semana…" />

  const planeadas = recetasSeleccionadas.length
  const libres = COMIDAS_POR_SEMANA - menu.reduce((total, dia) => total + MOMENTOS.filter(({ clave }) => dia[clave]).length, 0)
  const puedeRepetir = comidasSemanaPasada > 0 && libres > 0

  async function repetirSemanaPasada() {
    if (planeadas > 0 && !window.confirm('Copiamos la semana pasada solo en las comidas que están libres. ¿Seguimos?')) return
    setAviso('')
    setCopiando(true)
    try {
      const copiadas = await copiarSemana(lunesPasado)
      setAviso(
        copiadas === 0
          ? 'No había nada nuevo que copiar: esas comidas ya estaban elegidas.'
          : `Listo: copiamos ${copiadas} ${copiadas === 1 ? 'comida' : 'comidas'} de la semana pasada.`
      )
    } catch (e) {
      setAviso(mensajeError(e))
    } finally {
      setCopiando(false)
    }
  }

  // En móvil se pasa de un día a otro deslizando el dedo de lado.
  function alEmpezarToque(evento) {
    const toque = evento.touches[0]
    toqueRef.current = { x: toque.clientX, y: toque.clientY }
  }

  function alTerminarToque(evento) {
    if (!toqueRef.current) return
    const toque = evento.changedTouches[0]
    const dx = toque.clientX - toqueRef.current.x
    const dy = toque.clientY - toqueRef.current.y
    toqueRef.current = null
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
    setDiaActivo((actual) => Math.min(DIAS_SEMANA.length - 1, Math.max(0, actual + (dx < 0 ? 1 : -1))))
  }
  const momentoEligiendo = eligiendo && MOMENTOS.find((m) => m.clave === eligiendo.momento)
  const itemEligiendo = eligiendo && menu[eligiendo.dia][eligiendo.momento]

  return (
    <>
      <div className="menu-semanal-estado">
        <div className="menu-semanal-progreso">
          <p>
            <strong>
              {planeadas} de {COMIDAS_POR_SEMANA}
            </strong>{' '}
            comidas planeadas
          </p>
          <span className="barra-progreso" aria-hidden="true">
            <span style={{ width: `${(planeadas / COMIDAS_POR_SEMANA) * 100}%` }} />
          </span>
        </div>
        <span className="en-vivo" title="Lo que elija cualquier integrante aparece aquí al instante.">
          <span className="en-vivo-punto" aria-hidden="true" />
          En vivo
        </span>
      </div>
      {error && <p className="mensaje-error menu-semanal-error">{error}</p>}

      {planeadas === 0 && puedeRepetir && (
        <div className="menu-semanal-sugerencia">
          <span className="mosaico" aria-hidden="true">
            <Repeat />
          </span>
          <div>
            <p className="menu-semanal-sugerencia-titulo">¿Repiten la semana pasada?</p>
            <p>
              Tenía {comidasSemanaPasada} {comidasSemanaPasada === 1 ? 'comida' : 'comidas'}. Las copiamos aquí y luego
              cambian lo que quieran.
            </p>
          </div>
          <button type="button" className="boton boton-primario" onClick={repetirSemanaPasada} disabled={copiando}>
            {copiando ? 'Copiando…' : 'Repetir semana pasada'}
          </button>
        </div>
      )}
      <div aria-live="polite">{aviso && <p className="mensaje-exito menu-semanal-aviso">{aviso}</p>}</div>

      {/* En móvil se ve un día a la vez: esta tira elige cuál. */}
      <div className="menu-semanal-dias" role="group" aria-label="Elegir día">
        {DIAS_SEMANA.map((dia, indice) => {
          const fecha = sumarDias(lunes, indice)
          const esHoy = fechaISO(fecha) === fechaISO(new Date())
          const llenas = MOMENTOS.filter(({ clave }) => menu[indice][clave]).length
          return (
            <button
              key={dia}
              type="button"
              className={`menu-semanal-dia ${esHoy ? 'es-hoy' : ''}`}
              aria-pressed={diaActivo === indice}
              aria-label={`${dia} ${fecha.getDate()}${esHoy ? ', hoy' : ''}: ${llenas} de ${MOMENTOS.length} comidas`}
              onClick={() => setDiaActivo(indice)}
            >
              <span>{dia.slice(0, 3)}</span>
              <strong>{fecha.getDate()}</strong>
              <span className="menu-semanal-dia-puntos" aria-hidden="true">
                {MOMENTOS.map(({ clave }) => (
                  <i key={clave} className={menu[indice][clave] ? 'lleno' : ''} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="menu-semanal-grid" onTouchStart={alEmpezarToque} onTouchEnd={alTerminarToque}>
        {DIAS_SEMANA.map((dia, indiceDia) => {
          const fechaDia = sumarDias(lunes, indiceDia)
          const esHoy = fechaISO(fechaDia) === fechaISO(new Date())
          return (
            <section
              key={dia}
              className={`dia-card ${esHoy ? 'es-hoy' : ''} ${diaActivo === indiceDia ? 'activo' : ''}`}
              aria-labelledby={`dia-${indiceDia}`}
            >
              <h2 id={`dia-${indiceDia}`}>
                {dia} <span className="dia-card-fecha">{fechaDia.getDate()}</span>
                {esHoy && <span className="dia-card-hoy">Hoy</span>}
              </h2>
              {MOMENTOS.map((momento) => {
                const item = menu[indiceDia][momento.clave]
                return (
                  <ComidaSlot
                    key={momento.clave}
                    momento={momento}
                    item={item}
                    receta={item && recetaPorId(item.receta_id)}
                    usuarioId={usuario?.id}
                    alAbrir={() => setEligiendo({ dia: indiceDia, momento: momento.clave })}
                  />
                )
              })}
            </section>
          )
        })}
      </div>

      {planeadas > 0 && (
        <div className="menu-semanal-mas">
          {puedeRepetir && (
            <button type="button" className="menu-semanal-mas-boton" onClick={repetirSemanaPasada} disabled={copiando}>
              <Repeat size={16} aria-hidden="true" /> Llenar lo libre con la semana pasada
            </button>
          )}
          <button
            type="button"
            className="menu-semanal-mas-boton peligro"
            onClick={() => {
              if (window.confirm('¿Quitar todas las comidas de esta semana para toda la familia?')) limpiarMenu()
            }}
          >
            Vaciar la semana
          </button>
        </div>
      )}

      <ListaMercado menuId={menuId} lunes={lunes} menu={menu} items={listaMercado} />

      <Comentarios
        tipo="menu"
        objetivoId={menuId}
        titulo="Conversación de la semana"
        descripcion="Propongan cambios, voten por su plato favorito o pónganse de acuerdo en quién cocina."
      />

      {eligiendo && (
        <SelectorReceta
          momento={eligiendo.momento}
          titulo={`${momentoEligiendo.etiqueta} del ${DIAS_SEMANA[eligiendo.dia].toLowerCase()} ${sumarDias(lunes, eligiendo.dia).getDate()}`}
          recetaActualId={itemEligiendo?.receta_id}
          alElegir={(recetaId) => seleccionarReceta(eligiendo.dia, eligiendo.momento, recetaId)}
          alQuitar={() => seleccionarReceta(eligiendo.dia, eligiendo.momento, '')}
          alCerrar={() => setEligiendo(null)}
        />
      )}
    </>
  )
}

// Lo comprado se marca en este teléfono (no se comparte con la familia).
function useComprados(menuId) {
  const clave = `pensil-food:mercado:${menuId}`
  const [comprados, setComprados] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(clave)) || []
    } catch {
      return []
    }
  })

  function alternar(id) {
    setComprados((actuales) => {
      const nuevos = actuales.includes(id) ? actuales.filter((c) => c !== id) : [...actuales, id]
      try {
        localStorage.setItem(clave, JSON.stringify(nuevos))
      } catch {
        // Sin almacenamiento (modo privado): las marcas duran mientras la página esté abierta.
      }
      return nuevos
    })
  }

  return [comprados, alternar]
}

function ListaMercado({ menuId, lunes, menu, items }) {
  const { recetaPorId } = useRecetas()
  const [comprados, alternar] = useComprados(menuId)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  // Lo que ya está en el carrito baja al final de la lista.
  const conId = items
    .map((item) => ({ ...item, id: `${item.claveNombre}|${item.texto}` }))
    .sort((a, b) => Number(comprados.includes(a.id)) - Number(comprados.includes(b.id)))
  const listos = conId.filter((item) => comprados.includes(item.id)).length

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
      await descargarListaMercadoPdf(diasConRecetas, items)
    } finally {
      setGenerandoPdf(false)
    }
  }

  function enviarPorWhatsapp() {
    const pendientes = conId.filter((item) => !comprados.includes(item.id))
    const texto = [`Lista de mercado (${textoSemana(lunes)})`, ...pendientes.map((item) => `- ${item.texto}`)].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  }

  return (
    <section className="lista-mercado" id="lista-mercado" aria-labelledby="lista-mercado-titulo">
      <div className="lista-mercado-encabezado">
        <h2 id="lista-mercado-titulo">Lista de mercado</h2>
        {items.length > 0 && (
          <p>
            {listos === items.length
              ? 'Ya tienen todo.'
              : `${listos} de ${items.length} ingredientes en el carrito`}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <EstadoVacio
          icono={ShoppingBasket}
          titulo="Aún no hay nada en la lista"
          mensaje="Elijan las comidas de la semana y aquí aparecerán los ingredientes que necesitan comprar."
        />
      ) : (
        <>
          <ul className="lista-mercado-items">
            {conId.map((item) => {
              const comprado = comprados.includes(item.id)
              return (
                <li key={item.id}>
                  <label className={comprado ? 'comprado' : ''}>
                    <input type="checkbox" checked={comprado} onChange={() => alternar(item.id)} />
                    <span className="lista-mercado-casilla" aria-hidden="true">
                      <Check size={14} />
                    </span>
                    <span className="lista-mercado-texto">{item.texto}</span>
                    {!item.esNumerico && item.veces > 1 && (
                      <span className="lista-mercado-cantidad">×{item.veces}</span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
          <div className="lista-mercado-acciones">
            <button type="button" className="boton boton-primario" onClick={descargarPdf} disabled={generandoPdf}>
              <Download aria-hidden="true" />
              {generandoPdf ? 'Preparando PDF…' : 'Descargar PDF'}
            </button>
            <button type="button" className="boton boton-secundario" onClick={enviarPorWhatsapp}>
              <Send aria-hidden="true" /> Enviar por WhatsApp
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default MenuSemanal
