import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChefHat,
  Clock,
  Heart,
  Minus,
  Pencil,
  Plus,
  Share2,
  Sun,
  Trash2,
} from 'lucide-react'
import { iconoDeCategoria } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import { mensajeError, supabase } from '../lib/supabase'
import { formatIngrediente } from '../utils/ingredientes'
import { claseDificultad } from '../utils/dificultad'
import AgregarAlMenu from '../components/AgregarAlMenu'
import Cargando from '../components/Cargando'
import Comentarios from '../components/Comentarios'
import EstadoVacio from '../components/EstadoVacio'
import './DetalleReceta.css'

// Límites razonables para el selector de porciones.
const PORCIONES_MIN = 1
const PORCIONES_MAX = 12

// Mantiene la pantalla encendida mientras se cocina (Screen Wake Lock API).
// El navegador suelta el bloqueo al cambiar de pestaña: se pide de nuevo al volver.
function usePantallaEncendida() {
  const soportado = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [activa, setActiva] = useState(false)
  const bloqueoRef = useRef(null)

  const pedir = useCallback(async () => {
    try {
      bloqueoRef.current = await navigator.wakeLock.request('screen')
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (!activa) return undefined
    function alVolver() {
      if (document.visibilityState === 'visible') pedir()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      bloqueoRef.current?.release().catch(() => {})
      bloqueoRef.current = null
    }
  }, [activa, pedir])

  async function alternar() {
    if (activa) {
      setActiva(false)
      return
    }
    if (await pedir()) setActiva(true)
  }

  return { soportado, activa, alternar }
}

// Página de detalle: foto, datos, ingredientes que se ajustan a las porciones,
// pasos que se marcan mientras se cocina y comentarios de la familia.
function DetalleReceta() {
  const { id } = useParams()
  const { recetaPorId, cargando } = useRecetas()
  const receta = recetaPorId(id)

  if (!receta && cargando) {
    return (
      <div className="contenido-pagina">
        <Cargando texto="Cargando receta…" />
      </div>
    )
  }

  if (!receta) {
    return (
      <div className="contenido-pagina">
        <div className="contenedor seccion">
          <EstadoVacio
            icono={ChefHat}
            titulo="No encontramos esta receta"
            mensaje="Puede que el enlace esté roto o que la receta ya no exista."
          >
            <Link to="/recetas" className="boton boton-secundario">
              <ArrowLeft aria-hidden="true" /> Ver todas las recetas
            </Link>
          </EstadoVacio>
        </div>
      </div>
    )
  }

  // La key reinicia porciones y marcas al pasar de una receta a otra.
  return <Receta key={receta.id} receta={receta} />
}

function Receta({ receta }) {
  const { usuario, familia } = useAuth()
  const { recargar } = useRecetas()
  const navigate = useNavigate()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const pantalla = usePantallaEncendida()
  const [porciones, setPorciones] = useState(receta.porciones)
  const [ingredientesListos, setIngredientesListos] = useState(() => new Set())
  const [pasosHechos, setPasosHechos] = useState(() => new Set())
  const [faltaImagen, setFaltaImagen] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [errorBorrar, setErrorBorrar] = useState('')

  const favorita = esFavorito(receta.id)
  const esDeMiFamilia = Boolean(familia && receta.familiaId === familia.id)
  const IconoCategoria = iconoDeCategoria(receta.categoria)

  function alternarEn(setConjunto, indice) {
    setConjunto((actuales) => {
      const nuevos = new Set(actuales)
      if (nuevos.has(indice)) nuevos.delete(indice)
      else nuevos.add(indice)
      return nuevos
    })
  }

  async function borrarReceta() {
    if (!window.confirm(`¿Borrar "${receta.nombre}"? También se quitará de los menús y se borrarán sus comentarios.`)) {
      return
    }
    setErrorBorrar('')
    const { error } = await supabase.from('recetas').delete().eq('id', receta.id)
    if (error) {
      setErrorBorrar(mensajeError(error))
      return
    }
    await recargar()
    navigate('/recetas', { replace: true })
  }

  async function compartir() {
    const ingredientes = receta.ingredientes.map((ing) => `- ${formatIngrediente(ing, receta.porciones, receta.porciones)}`)
    const texto = [`${receta.nombre} (Pensil.Food)`, '', 'Ingredientes:', ...ingredientes, '', window.location.href].join('\n')
    if (navigator.share) {
      try {
        await navigator.share({ title: receta.nombre, text: texto })
      } catch {
        // Cerró el menú de compartir: no es un error.
      }
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  }

  function abrirAgregar() {
    setAviso('')
    if (!usuario) {
      navigate('/ingresar', { state: { desde: `/recetas/${receta.id}` } })
      return
    }
    if (!familia) {
      navigate('/familia')
      return
    }
    setAgregando(true)
  }

  const totalPasos = receta.pasos.length
  const hechos = pasosHechos.size

  return (
    <div className="contenido-pagina">
      <div className="contenedor detalle">
        <Link to="/recetas" className="detalle-volver">
          <ArrowLeft size={18} aria-hidden="true" /> Recetas
        </Link>

        <div className="detalle-receta">
          <div className="detalle-imagen-contenedor">
            {faltaImagen || !receta.imagen ? (
              <div className="detalle-imagen-fallback ficha-receta" aria-hidden="true">
                <span className="mosaico">
                  <IconoCategoria />
                </span>
              </div>
            ) : (
              <img src={receta.imagen} alt={receta.nombre} className="detalle-imagen" onError={() => setFaltaImagen(true)} />
            )}
            <button
              type="button"
              className={`detalle-corazon ${favorita ? 'es-favorito' : ''}`}
              onClick={() => alternarFavorito(receta.id)}
              aria-pressed={favorita}
              aria-label={favorita ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart size={22} aria-hidden="true" fill={favorita ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="detalle-info">
            <div className="detalle-etiquetas">
              <Link to={`/recetas?categoria=${encodeURIComponent(receta.categoria)}`} className="detalle-categoria">
                <IconoCategoria size={18} aria-hidden="true" />
                {receta.categoria}
              </Link>
              {esDeMiFamilia && <span className="etiqueta etiqueta-familia">Receta de {familia.nombre}</span>}
            </div>

            <h1>{receta.nombre}</h1>
            {receta.descripcion && <p className="detalle-descripcion">{receta.descripcion}</p>}

            <dl className="detalle-meta">
              <div>
                <dt>Tiempo</dt>
                <dd>
                  <Clock size={18} aria-hidden="true" /> {receta.tiempoPreparacion} min
                </dd>
              </div>
              <div>
                <dt>Dificultad</dt>
                <dd>
                  <span className={`etiqueta ${claseDificultad(receta.dificultad)}`}>{receta.dificultad}</span>
                </dd>
              </div>
              <div>
                <dt id="porciones-titulo">Porciones</dt>
                <dd className="detalle-porciones" role="group" aria-labelledby="porciones-titulo">
                  <button
                    type="button"
                    className="detalle-porciones-boton"
                    onClick={() => setPorciones((actual) => Math.max(PORCIONES_MIN, actual - 1))}
                    disabled={porciones <= PORCIONES_MIN}
                    aria-label="Quitar una porción"
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span className="detalle-porciones-valor" aria-live="polite">
                    {porciones}
                  </span>
                  <button
                    type="button"
                    className="detalle-porciones-boton"
                    onClick={() => setPorciones((actual) => Math.min(PORCIONES_MAX, actual + 1))}
                    disabled={porciones >= PORCIONES_MAX}
                    aria-label="Agregar una porción"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </dd>
              </div>
            </dl>

            <div className="detalle-acciones">
              <button type="button" className="boton boton-primario detalle-agregar" onClick={abrirAgregar}>
                <CalendarPlus aria-hidden="true" /> Agregar al menú
              </button>
              <button type="button" className="boton boton-secundario detalle-compartir" onClick={compartir}>
                <Share2 aria-hidden="true" /> <span>Compartir</span>
              </button>
            </div>
            <div aria-live="polite">
              {aviso && (
                <p className="mensaje-exito detalle-aviso">
                  <Check size={16} aria-hidden="true" /> Quedó en {aviso}.{' '}
                  <Link to="/menu-semanal">Ver menú</Link>
                </p>
              )}
            </div>

            {esDeMiFamilia && (
              <div className="detalle-gestion">
                <Link to={`/recetas/${receta.id}/editar`} className="detalle-gestion-enlace">
                  <Pencil size={16} aria-hidden="true" /> Editar receta
                </Link>
                <button type="button" className="detalle-gestion-enlace peligro" onClick={borrarReceta}>
                  <Trash2 size={16} aria-hidden="true" /> Borrar
                </button>
              </div>
            )}
            {errorBorrar && <p className="mensaje-error">{errorBorrar}</p>}
          </div>
        </div>

        <div className="detalle-cuerpo">
          {/* Los ingredientes van en una ficha de receta: renglones y margen tomate. */}
          <section className="detalle-ingredientes ficha-receta" aria-labelledby="titulo-ingredientes">
            <h2 id="titulo-ingredientes">Ingredientes</h2>
            <p className="detalle-nota">
              Para {porciones} {porciones === 1 ? 'porción' : 'porciones'}. Márcalos a medida que los tengas.
            </p>
            <ul key={porciones} className="detalle-ingredientes-lista">
              {receta.ingredientes.map((ingrediente, indice) => (
                <li key={indice}>
                  <label className={ingredientesListos.has(indice) ? 'listo' : ''}>
                    <input
                      type="checkbox"
                      checked={ingredientesListos.has(indice)}
                      onChange={() => alternarEn(setIngredientesListos, indice)}
                    />
                    <span>{formatIngrediente(ingrediente, receta.porciones, porciones)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="detalle-pasos" aria-labelledby="titulo-preparacion">
            <div className="detalle-pasos-cabecera">
              <div>
                <h2 id="titulo-preparacion">Preparación</h2>
                {totalPasos > 0 && (
                  <p className="detalle-nota" aria-live="polite">
                    {hechos === 0
                      ? 'Toca cada paso cuando lo termines.'
                      : hechos === totalPasos
                        ? '¡Listo! A servir.'
                        : `${hechos} de ${totalPasos} pasos hechos`}
                  </p>
                )}
              </div>
              {pantalla.soportado && (
                <button
                  type="button"
                  className="detalle-pantalla"
                  aria-pressed={pantalla.activa}
                  onClick={pantalla.alternar}
                >
                  <Sun size={18} aria-hidden="true" />
                  {pantalla.activa ? 'Pantalla encendida' : 'No apagar pantalla'}
                </button>
              )}
            </div>
            <ol>
              {receta.pasos.map((paso, indice) => {
                const hecho = pasosHechos.has(indice)
                return (
                  <li key={indice}>
                    <label className={hecho ? 'hecho' : ''}>
                      <input type="checkbox" checked={hecho} onChange={() => alternarEn(setPasosHechos, indice)} />
                      <span
                        className={`detalle-paso-numero ${indice === totalPasos - 1 ? 'ultimo' : ''}`}
                        aria-hidden="true"
                      >
                        {hecho ? <Check size={16} /> : indice + 1}
                      </span>
                      <span className="detalle-paso-texto">
                        <span className="solo-lectores">Paso {indice + 1}: </span>
                        {paso}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>

        <Comentarios
          tipo="receta"
          objetivoId={receta.id}
          titulo="Comentarios de la familia"
          descripcion="¿La prepararon? ¿Qué le cambiarían? Déjenlo anotado aquí."
        />
      </div>

      {agregando && (
        <AgregarAlMenu receta={receta} alAgregar={setAviso} alCerrar={() => setAgregando(false)} />
      )}
    </div>
  )
}

export default DetalleReceta
