import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { ICONOS_CATEGORIA } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import { mensajeError, supabase } from '../lib/supabase'
import { formatIngrediente } from '../utils/ingredientes'
import Cargando from '../components/Cargando'
import Comentarios from '../components/Comentarios'
import EstadoVacio from '../components/EstadoVacio'
import './DetalleReceta.css'

// Límites razonables para el selector de porciones.
const PORCIONES_MIN = 1
const PORCIONES_MAX = 12

function claseDificultad(dificultad) {
  if (dificultad === 'Fácil') return 'etiqueta-dificultad-facil'
  if (dificultad === 'Media') return 'etiqueta-dificultad-media'
  return 'etiqueta-dificultad-dificil'
}

// Página de detalle: muestra toda la información de una receta según su id en la URL.
function DetalleReceta() {
  const { id } = useParams()
  const { recetaPorId, cargando, recargar } = useRecetas()
  const receta = recetaPorId(id)
  const { familia } = useAuth()
  const navigate = useNavigate()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const [errorBorrar, setErrorBorrar] = useState('')
  const [faltaImagen, setFaltaImagen] = useState(false)
  const [porciones, setPorciones] = useState(receta ? receta.porciones : PORCIONES_MIN)

  // Si se navega directo a otra receta (cambia el id), reinicia el selector
  // a las porciones base de la receta nueva.
  useEffect(() => {
    if (receta) setPorciones(receta.porciones)
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
            icono="🍳"
            titulo="No encontramos esta receta"
            mensaje="Puede que el enlace esté roto o la receta ya no exista."
          />
          <div className="detalle-volver-contenedor">
            <Link to="/recetas" className="boton boton-secundario">
              ← Volver a recetas
            </Link>
          </div>
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

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <Link to="/recetas" className="detalle-volver">
          ← Volver a recetas
        </Link>

        <div className="detalle-receta">
          <div className="detalle-imagen-contenedor">
            {faltaImagen || !receta.imagen ? (
              <div className="detalle-imagen-fallback" aria-hidden="true">
                {ICONOS_CATEGORIA[receta.categoria] || '🍽️'}
              </div>
            ) : (
              <img
                src={receta.imagen}
                alt={receta.nombre}
                className="detalle-imagen"
                onError={() => setFaltaImagen(true)}
              />
            )}
            <span className="etiqueta etiqueta-categoria detalle-categoria">
              {receta.categoria}
            </span>
          </div>

          <div className="detalle-info">
            <div className="detalle-encabezado">
              <h1>{receta.nombre}</h1>
              <button
                type="button"
                className={`detalle-favorito ${favorita ? 'es-favorito' : ''}`}
                onClick={() => alternarFavorito(receta.id)}
                aria-label={favorita ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                {favorita ? '♥' : '♡'}
              </button>
            </div>

            <p className="detalle-descripcion">{receta.descripcion}</p>

            <div className="detalle-meta">
              <span>⏱ {receta.tiempoPreparacion} min</span>
              <div className="detalle-porciones" role="group" aria-label="Ajustar número de porciones">
                <button
                  type="button"
                  className="detalle-porciones-boton"
                  onClick={disminuirPorciones}
                  disabled={porciones <= PORCIONES_MIN}
                  aria-label="Quitar una porción"
                >
                  −
                </button>
                <span className="detalle-porciones-valor">
                  🍽 {porciones} {porciones === 1 ? 'porción' : 'porciones'}
                </span>
                <button
                  type="button"
                  className="detalle-porciones-boton"
                  onClick={aumentarPorciones}
                  disabled={porciones >= PORCIONES_MAX}
                  aria-label="Agregar una porción"
                >
                  +
                </button>
              </div>
              <span className={`etiqueta ${claseDificultad(receta.dificultad)}`}>
                {receta.dificultad}
              </span>
            </div>

            {esDeMiFamilia && (
              <div className="detalle-acciones-familia">
                <span className="etiqueta receta-card-familia-inline">Receta de {familia.nombre}</span>
                <Link to={`/recetas/${receta.id}/editar`} className="boton boton-contorno">
                  <Pencil size={16} aria-hidden="true" /> Editar
                </Link>
                <button type="button" className="boton boton-peligro" onClick={borrarReceta}>
                  <Trash2 size={16} aria-hidden="true" /> Borrar
                </button>
              </div>
            )}
            {errorBorrar && <p className="mensaje-error">{errorBorrar}</p>}
          </div>
        </div>

        <div className="detalle-cuerpo">
          <div className="detalle-ingredientes">
            <h2>Ingredientes</h2>
            <ul key={porciones} className="detalle-ingredientes-lista">
              {receta.ingredientes.map((ingrediente, indice) => (
                <li key={indice}>
                  {formatIngrediente(ingrediente, receta.porciones, porciones)}
                </li>
              ))}
            </ul>
          </div>

          <div className="detalle-pasos">
            <h2>Preparación</h2>
            <ol>
              {receta.pasos.map((paso, indice) => (
                <li key={indice}>
                  <span className="detalle-paso-numero">{indice + 1}</span>
                  <span>{paso}</span>
                </li>
              ))}
            </ol>
          </div>
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
