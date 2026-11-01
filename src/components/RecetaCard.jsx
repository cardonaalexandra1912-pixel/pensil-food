import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Heart, Users } from 'lucide-react'
import { iconoDeCategoria } from '../data/catalogo'
import { claseDificultad } from '../utils/dificultad'
import './RecetaCard.css'

// Tarjeta de receta (patrón ServiceCard de Pensil.Devs): el título es el
// enlace y su ::after cubre la tarjeta, así toda la tarjeta es clicable.
function RecetaCard({ receta, esFavorito, alFavorito }) {
  const favorita = esFavorito ? esFavorito(receta.id) : false
  const [faltaImagen, setFaltaImagen] = useState(false)
  const IconoCategoria = iconoDeCategoria(receta.categoria)

  return (
    <article className="receta-card">
      <div className="receta-card-imagen-contenedor">
        {faltaImagen || !receta.imagen ? (
          <div className="receta-card-imagen-fallback ficha-receta" aria-hidden="true">
            <span className="mosaico">
              <IconoCategoria />
            </span>
          </div>
        ) : (
          <img
            src={receta.imagen}
            alt=""
            className="receta-card-imagen"
            loading="lazy"
            onError={() => setFaltaImagen(true)}
          />
        )}

        {alFavorito && (
          <button
            type="button"
            className={`receta-card-favorito ${favorita ? 'es-favorito' : ''}`}
            onClick={() => alFavorito(receta.id)}
            aria-pressed={favorita}
            aria-label={favorita ? `Quitar ${receta.nombre} de favoritos` : `Guardar ${receta.nombre} en favoritos`}
          >
            <Heart size={20} aria-hidden="true" fill={favorita ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="receta-card-contenido">
        <div className="receta-card-etiquetas">
          <span className="receta-card-categoria">
            <IconoCategoria size={16} aria-hidden="true" />
            {receta.categoria}
          </span>
          {receta.familiaId && <span className="etiqueta etiqueta-familia">De mi familia</span>}
        </div>

        <h3 className="receta-card-nombre">
          <Link to={`/recetas/${receta.id}`}>{receta.nombre}</Link>
        </h3>
        <p className="receta-card-descripcion">{receta.descripcion}</p>

        <div className="receta-card-meta">
          <span>
            <Clock size={16} aria-hidden="true" /> {receta.tiempoPreparacion} min
          </span>
          <span>
            <Users size={16} aria-hidden="true" /> {receta.porciones}{' '}
            {receta.porciones === 1 ? 'porción' : 'porciones'}
          </span>
          <span className={`etiqueta ${claseDificultad(receta.dificultad)}`}>{receta.dificultad}</span>
        </div>

        <span className="receta-card-ver" aria-hidden="true">
          Ver receta <ArrowRight size={18} />
        </span>
      </div>
    </article>
  )
}

export default RecetaCard
