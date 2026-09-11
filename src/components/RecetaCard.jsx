import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ICONOS_CATEGORIA } from '../data/recetas'
import './RecetaCard.css'

// Convierte "Fácil" / "Media" / "Difícil" en el nombre de clase CSS correspondiente
function claseDificultad(dificultad) {
  if (dificultad === 'Fácil') return 'etiqueta-dificultad-facil'
  if (dificultad === 'Media') return 'etiqueta-dificultad-media'
  return 'etiqueta-dificultad-dificil'
}

// Tarjeta de receta reutilizada en Inicio, Recetas y Favoritos.
// Recibe la receta a mostrar y las funciones para saber/marcar si es favorita.
function RecetaCard({ receta, esFavorito, alFavorito }) {
  const favorita = esFavorito ? esFavorito(receta.id) : false
  // Mientras no exista el archivo de foto real, mostramos un fallback en vez de un ícono roto
  const [faltaImagen, setFaltaImagen] = useState(false)

  return (
    <article className="receta-card">
      <div className="receta-card-imagen-contenedor">
        {faltaImagen ? (
          <div className="receta-card-imagen-fallback" aria-hidden="true">
            {ICONOS_CATEGORIA[receta.categoria] || '🍽️'}
          </div>
        ) : (
          <img
            src={receta.imagen}
            alt={receta.nombre}
            className="receta-card-imagen"
            onError={() => setFaltaImagen(true)}
          />
        )}

        {/* Botón de corazón para agregar/quitar de favoritos */}
        {alFavorito && (
          <button
            type="button"
            className={`receta-card-favorito ${favorita ? 'es-favorito' : ''}`}
            onClick={() => alFavorito(receta.id)}
            aria-label={favorita ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            title={favorita ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {favorita ? '♥' : '♡'}
          </button>
        )}

        <span className="etiqueta etiqueta-categoria receta-card-categoria">
          {receta.categoria}
        </span>
      </div>

      <div className="receta-card-contenido">
        <h3 className="receta-card-nombre">{receta.nombre}</h3>
        <p className="receta-card-descripcion">{receta.descripcion}</p>

        <div className="receta-card-meta">
          <span>⏱ {receta.tiempoPreparacion} min</span>
          <span>🍽 {receta.porciones} porciones</span>
          <span className={`etiqueta ${claseDificultad(receta.dificultad)}`}>
            {receta.dificultad}
          </span>
        </div>

        <Link to={`/recetas/${receta.id}`} className="boton boton-primario receta-card-boton">
          Ver receta
        </Link>
      </div>
    </article>
  )
}

export default RecetaCard
