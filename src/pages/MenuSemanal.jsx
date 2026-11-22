import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Download, Repeat, Send, ShoppingBasket } from 'lucide-react'
import { MOMENTOS } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../lib/supabase'
import { useRecetas } from '../context/RecetasContext'
import {
  DIAS_SEMANA,
  contarComidasDeSemana,
  contarComidasLlenas,
  recetasDelMenu,
  useMenuSemanal,
} from '../hooks/useMenuSemanal'
import { armarListaMercado } from '../utils/listaMercado'
import { descargarListaMercadoPdf } from '../utils/listaMercadoPdf'
import { desdeISO, fechaISO, indiceEnSemana, lunesDe, sumarDias, textoSemana } from '../utils/fechas'
import AvisoSinFamilia from '../components/AvisoSinFamilia'
import Cargando from '../components/Cargando'
import ComidaSlot, { CATEGORIA_BEBIDAS } from '../components/ComidaSlot'
import Comentarios from '../components/Comentarios'
import EstadoVacio from '../components/EstadoVacio'
import SelectorReceta from '../components/SelectorReceta'
import './MenuSemanal.css'

const COMIDAS_POR_SEMANA = DIAS_SEMANA.length * MOMENTOS.length

// Página de Menú Semanal: el plan de la familia para una semana (lunes a
// domingo). Cualquier integrante elige desayuno, almuerzo y cena de cada día
// (cada comida puede tener varios platos, como sopa y plato fuerte);
// los cambios se ven en vivo y la lista de mercado se arma sola.
function MenuSemanal() {
  const { familia } = useAuth()
  const [parametros, setParametros] = useSearchParams()

  // La semana se guarda en la URL (?semana=2026-11-02) para poder compartirla.
  const semanaURL = parametros.get('semana')
  const lunes = useMemo(
    () => lunesDe(semanaURL && /^\d{4}-\d{2}-\d{2}$/.test(semanaURL) ? desdeISO(semanaURL) : new Date()),
    [semanaURL],
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
  const { recetaPorId, productos } = useRecetas()
  const { hash } = useLocation()
  const { menuId, menu, cargando, error, agregarReceta, cambiarReceta, quitarReceta, limpiarMenu, copiarSemana } =
    useMenuSemanal(lunes)
  const [diaActivo, setDiaActivo] = useState(esSemanaActual ? indiceEnSemana(new Date()) : 0)
  // { dia, momento, item } mientras la hoja está abierta; item es el plato que
  // se cambia, o null si se está agregando un plato a la comida.
  const [eligiendo, setEligiendo] = useState(null)
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
    () => armarListaMercado(recetasSeleccionadas, productos),
    [recetasSeleccionadas, productos],
  )

  // Desde el inicio se puede llegar directo a la lista (/menu-semanal#lista-mercado).
  useEffect(() => {
    if (!cargando && hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [cargando, hash])

  if (cargando) return <Cargando texto="Cargando el menú de la semana…" />

  const planeadas = contarComidasLlenas(menu)
  const libres = COMIDAS_POR_SEMANA - planeadas
  const puedeRepetir = comidasSemanaPasada > 0 && libres > 0

  async function repetirSemanaPasada() {
    if (planeadas > 0 && !window.confirm('Copiamos la semana pasada solo en las comidas que están libres. ¿Seguimos?'))
      return
    setAviso('')
    setCopiando(true)
    try {
      const copiadas = await copiarSemana(lunesPasado)
      setAviso(
        copiadas === 0
          ? 'No había nada nuevo que copiar: esas comidas ya estaban elegidas.'
          : `Listo: copiamos ${copiadas} ${copiadas === 1 ? 'comida' : 'comidas'} de la semana pasada.`,
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
          const llenas = MOMENTOS.filter(({ clave }) => menu[indice][clave].length > 0).length
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
                  <i key={clave} className={menu[indice][clave].length > 0 ? 'lleno' : ''} />
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
              {MOMENTOS.map((momento) => (
                <ComidaSlot
                  key={momento.clave}
                  momento={momento}
                  items={menu[indiceDia][momento.clave]}
                  recetaPorId={recetaPorId}
                  usuarioId={usuario?.id}
                  alAgregar={() => setEligiendo({ dia: indiceDia, momento: momento.clave, item: null })}
                  alAgregarBebida={() =>
                    setEligiendo({ dia: indiceDia, momento: momento.clave, item: null, bebida: true })
                  }
                  alCambiar={(item) => setEligiendo({ dia: indiceDia, momento: momento.clave, item })}
                />
              ))}
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

      <ListaMercado menuId={menuId} lunes={lunes} menu={menu} lista={listaMercado} />

      <Comentarios
        tipo="menu"
        objetivoId={menuId}
        titulo="Conversación de la semana"
        descripcion="Propongan cambios, voten por su plato favorito o pónganse de acuerdo en quién cocina."
      />

      {eligiendo && (
        <SelectorReceta
          momento={eligiendo.momento}
          titulo={`${
            eligiendo.bebida
              ? `Bebida para ${eligiendo.momento === 'cena' ? 'la' : 'el'} ${momentoEligiendo.etiqueta.toLowerCase()}`
              : !eligiendo.item && menu[eligiendo.dia][eligiendo.momento].length > 0
                ? `Otro plato para ${eligiendo.momento === 'cena' ? 'la' : 'el'} ${momentoEligiendo.etiqueta.toLowerCase()}`
                : momentoEligiendo.etiqueta
          } del ${DIAS_SEMANA[eligiendo.dia].toLowerCase()} ${sumarDias(lunes, eligiendo.dia).getDate()}`}
          filtroInicial={eligiendo.bebida ? CATEGORIA_BEBIDAS : undefined}
          recetaActualId={eligiendo.item?.receta_id}
          otrasIds={menu[eligiendo.dia][eligiendo.momento].map((item) => item.receta_id)}
          alElegir={(recetaId) =>
            eligiendo.item
              ? cambiarReceta(eligiendo.item.id, recetaId)
              : agregarReceta(eligiendo.dia, eligiendo.momento, recetaId)
          }
          alQuitar={() => quitarReceta(eligiendo.item.id)}
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

function ListaMercado({ menuId, lunes, menu, lista }) {
  const { recetaPorId } = useRecetas()
  const [comprados, alternar] = useComprados(menuId)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  // Lo que se compra, por pasillo; lo de "Otros" (no reconocido) va al final.
  const grupos = [
    ...lista.secciones.map((seccion) => ({ ...seccion, tipo: 'compra' })),
    ...(lista.otros.length > 0 ? [{ nombre: 'Otros', items: lista.otros, tipo: 'compra' }] : []),
  ]
  const porComprar = grupos.flatMap((grupo) => grupo.items)
  const listos = porComprar.filter((item) => comprados.includes(item.id)).length
  const vacia = porComprar.length === 0 && lista.despensa.length === 0

  async function descargarPdf() {
    const diasConRecetas = DIAS_SEMANA.map((dia, indice) => ({
      dia: `${dia} ${sumarDias(lunes, indice).getDate()}`,
      comidas: MOMENTOS.map(({ clave, etiqueta }) => ({
        momento: etiqueta,
        nombre: menu[indice][clave]
          .map((item) => recetaPorId(item.receta_id)?.nombre)
          .filter(Boolean)
          .join(' + '),
      })).filter((comida) => comida.nombre),
    })).filter((dia) => dia.comidas.length > 0)

    setGenerandoPdf(true)
    try {
      await descargarListaMercadoPdf(diasConRecetas, grupos, lista.despensa)
    } finally {
      setGenerandoPdf(false)
    }
  }

  function enviarPorWhatsapp() {
    const lineas = [`*Lista de mercado* (${textoSemana(lunes)})`]
    grupos.forEach((grupo) => {
      const pendientes = grupo.items.filter((item) => !comprados.includes(item.id))
      if (pendientes.length === 0) return
      lineas.push('', `*${grupo.nombre}*`)
      pendientes.forEach((item) => lineas.push(`- ${item.nombre}${item.cantidad ? `: ${item.cantidad}` : ''}`))
    })
    if (lista.despensa.length > 0) {
      lineas.push('', '*Revisar en la despensa*', lista.despensa.map((item) => item.nombre).join(', '))
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank', 'noopener')
  }

  return (
    <section className="lista-mercado" id="lista-mercado" aria-labelledby="lista-mercado-titulo">
      <div className="lista-mercado-encabezado">
        <h2 id="lista-mercado-titulo">Lista de mercado</h2>
        {porComprar.length > 0 && (
          <p>
            {listos === porComprar.length
              ? 'Ya tienen todo.'
              : `${listos} de ${porComprar.length} productos en el carrito`}
          </p>
        )}
      </div>

      {vacia ? (
        <EstadoVacio
          icono={ShoppingBasket}
          titulo="Aún no hay nada en la lista"
          mensaje="Elijan las comidas de la semana y aquí aparecerán los productos que necesitan comprar."
        />
      ) : (
        <>
          {grupos.map((grupo) => (
            <GrupoMercado
              key={grupo.nombre}
              titulo={grupo.nombre}
              items={grupo.items}
              comprados={comprados}
              alternar={alternar}
            />
          ))}
          {lista.despensa.length > 0 && (
            <GrupoMercado
              titulo="Revisa en la despensa"
              descripcion="Casi siempre hay en casa. Marca lo que ya tienes y compra solo lo que falte."
              items={lista.despensa}
              comprados={comprados}
              alternar={alternar}
            />
          )}
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

// Un pasillo del mercado: cada producto con su cantidad de compra y para qué
// recetas es. Lo que ya está en el carrito baja al final del pasillo.
function GrupoMercado({ titulo, descripcion, items, comprados, alternar }) {
  const ordenados = [...items].sort((a, b) => Number(comprados.includes(a.id)) - Number(comprados.includes(b.id)))
  const id = `mercado-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div className="lista-mercado-grupo">
      <h3 id={id}>{titulo}</h3>
      {descripcion && <p className="lista-mercado-grupo-descripcion">{descripcion}</p>}
      <ul className="lista-mercado-items" aria-labelledby={id}>
        {ordenados.map((item) => {
          const comprado = comprados.includes(item.id)
          return (
            <li key={item.id}>
              <label className={comprado ? 'comprado' : ''}>
                <input type="checkbox" checked={comprado} onChange={() => alternar(item.id)} />
                <span className="lista-mercado-casilla" aria-hidden="true">
                  <Check size={14} />
                </span>
                <span className="lista-mercado-texto">
                  <span className="lista-mercado-nombre">{item.nombre}</span>
                  {item.recetas.length > 0 && (
                    <span className="lista-mercado-para">
                      {item.recetas.length > 2
                        ? `${item.recetas.slice(0, 2).join(' · ')} +${item.recetas.length - 2} más`
                        : item.recetas.join(' · ')}
                    </span>
                  )}
                </span>
                {item.cantidad && <span className="lista-mercado-cantidad">{item.cantidad}</span>}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default MenuSemanal
