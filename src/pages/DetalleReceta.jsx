import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ICONOS_CATEGORIA, recetas } from '../data/recetas'
import { useFavoritos } from '../hooks/useFavoritos'
import EstadoVacio from '../components/EstadoVacio'
import './DetalleReceta.css'

function claseDificultad(dificultad) {
  if (dificultad === 'Fácil') return 'etiqueta-dificultad-facil'
  if (dificultad === 'Media') return 'etiqueta-dificultad-media'
  return 'etiqueta-dificultad-dificil'
}

// Página de detalle: muestra toda la información de una receta según su id en la URL.
function DetalleReceta() {
  const { id } = useParams()
  const receta = recetas.find((r) => r.id === Number(id))
  const { esFavorito, alternarFavorito } = useFavoritos()
  const [faltaImagen, setFaltaImagen] = useState(false)

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

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <Link to="/recetas" className="detalle-volver">
          ← Volver a recetas
        </Link>

        <div className="detalle-receta">
          <div className="detalle-imagen-contenedor">
            {faltaImagen ? (
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
              <span>🍽 {receta.porciones} porciones</span>
              <span className={`etiqueta ${claseDificultad(receta.dificultad)}`}>
                {receta.dificultad}
              </span>
            </div>
          </div>
        </div>

        <div className="detalle-cuerpo">
          <div className="detalle-ingredientes">
            <h2>Ingredientes</h2>
            <ul>
              {receta.ingredientes.map((ingrediente, indice) => (
                <li key={indice}>{ingrediente}</li>
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
      </div>
    </div>
  )
}

export default DetalleReceta
