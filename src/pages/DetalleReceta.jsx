import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChefHat, Clock, Heart, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { iconoDeCategoria } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import { mensajeError, supabase } from '../lib/supabase'
import { formatIngrediente } from '../utils/ingredientes'
import { claseDificultad } from '../utils/dificultad'
import Cargando from '../components/Cargando'
import Comentarios from '../components/Comentarios'
import EstadoVacio from '../components/EstadoVacio'
import './DetalleReceta.css'

// Límites razonables para el selector de porciones.
const PORCIONES_MIN = 1
const PORCIONES_MAX = 12

// Página de detalle: muestra toda la información de una receta según su id en la URL.
function DetalleReceta() {
  const { id } = useParams()
  const { recetaPorId, cargando, recargar } = useRecetas()
  const receta = recetaPorId(id)
  const { familia } = useAuth()
  const navigate = useNavigate()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const [errorBorrar, setErrorBorrar] = useState('')
  // Ingredientes marcados mientras se cocina (solo en esta pantalla).
  const [listos, setListos] = useState(() => new Set())
  const [faltaImagen, setFaltaImagen] = useState(false)
  const [porciones, setPorciones] = useState(receta ? receta.porciones : PORCIONES_MIN)

  // Si se navega directo a otra receta (cambia el id), reinicia el selector
  // a las porciones base de la receta nueva.
  useEffect(() => {
    if (receta) setPorciones(receta.porciones)
    setListos(new Set())
  }, [receta?.id])

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

  const favorita = esFavorito(receta.id)
  const esDeMiFamilia = Boolean(familia && receta.familiaId === familia.id)

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

  function disminuirPorciones() {
    setPorciones((actual) => Math.max(PORCIONES_MIN, actual - 1))
  }

  function aumentarPorciones() {
    setPorciones((actual) => Math.min(PORCIONES_MAX, actual + 1))
  }

  function alternarListo(indice) {
    setListos((actuales) => {
      const nuevos = new Set(actuales)
      if (nuevos.has(indice)) nuevos.delete(indice)
      else nuevos.add(indice)
      return nuevos
    })
  }

  const IconoCategoria = iconoDeCategoria(receta.categoria)

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <Link to="/recetas" className="detalle-volver">
          <ArrowLeft size={18} aria-hidden="true" /> Todas las recetas
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
            <p className="texto-intro">{receta.descripcion}</p>

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
                    onClick={disminuirPorciones}
                    disabled={porciones <= PORCIONES_MIN}
                    aria-label="Quitar una porción"
                  >
                    <Minus size={18} aria-hidden="true" />
                  </button>
                  <span className="detalle-porciones-valor" aria-live="polite">
                    {porciones}
                  </span>
                  <button
                    type="button"
                    className="detalle-porciones-boton"
                    onClick={aumentarPorciones}
                    disabled={porciones >= PORCIONES_MAX}
                    aria-label="Agregar una porción"
                  >
                    <Plus size={18} aria-hidden="true" />
                  </button>
                </dd>
              </div>
            </dl>

            <div className="detalle-acciones">
              <button
                type="button"
                className={`boton boton-secundario detalle-favorito ${favorita ? 'es-favorito' : ''}`}
                onClick={() => alternarFavorito(receta.id)}
                aria-pressed={favorita}
              >
                <Heart aria-hidden="true" fill={favorita ? 'currentColor' : 'none'} />
                {favorita ? 'En tus favoritos' : 'Guardar en favoritos'}
              </button>
              {esDeMiFamilia && (
                <>
                  <Link to={`/recetas/${receta.id}/editar`} className="boton boton-secundario">
                    <Pencil aria-hidden="true" /> Editar
                  </Link>
                  <button type="button" className="boton boton-peligro" onClick={borrarReceta}>
                    <Trash2 aria-hidden="true" /> Borrar
                  </button>
                </>
              )}
            </div>
            {errorBorrar && <p className="mensaje-error">{errorBorrar}</p>}
          </div>
        </div>

        <div className="detalle-cuerpo">
          {/* Los ingredientes van en una ficha de receta: renglones y margen tomate. */}
          <section className="detalle-ingredientes ficha-receta" aria-labelledby="titulo-ingredientes">
            <h2 id="titulo-ingredientes">Ingredientes</h2>
            <p className="detalle-ingredientes-nota">
              Para {porciones} {porciones === 1 ? 'porción' : 'porciones'}. Márcalos mientras cocinas.
            </p>
            <ul key={porciones} className="detalle-ingredientes-lista">
              {receta.ingredientes.map((ingrediente, indice) => (
                <li key={indice}>
                  <label className={listos.has(indice) ? 'listo' : ''}>
                    <input type="checkbox" checked={listos.has(indice)} onChange={() => alternarListo(indice)} />
                    <span>{formatIngrediente(ingrediente, receta.porciones, porciones)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="detalle-pasos" aria-labelledby="titulo-preparacion">
            <h2 id="titulo-preparacion">Preparación</h2>
            <ol>
              {receta.pasos.map((paso, indice) => (
                <li key={indice}>
                  <span
                    className={`detalle-paso-numero ${indice === receta.pasos.length - 1 ? 'ultimo' : ''}`}
                    aria-hidden="true"
                  >
                    {indice + 1}
                  </span>
                  <p>{paso}</p>
                </li>
              ))}
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
    </div>
  )
}

export default DetalleReceta
