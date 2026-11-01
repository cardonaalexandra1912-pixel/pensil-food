import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { iconoDeCategoria } from '../data/catalogo'
import RecetaCard from './RecetaCard'
import './SeccionCategoria.css'

// Fila de recetas destacadas de una categoría, con enlace a "ver todas".
function SeccionCategoria({ categoria, recetas, esFavorito, alFavorito }) {
  // Solo mostramos hasta 4 recetas de esta categoría en la página de inicio
  const destacadas = recetas.filter((r) => r.categoria === categoria).slice(0, 4)
  if (destacadas.length === 0) return null

  const Icono = iconoDeCategoria(categoria)
  const idTitulo = `categoria-${categoria.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <section className="seccion-categoria" aria-labelledby={idTitulo}>
      <div className="seccion-categoria-encabezado">
        <h3 id={idTitulo}>
          <span className="mosaico">
            <Icono aria-hidden="true" />
          </span>
          {categoria}
        </h3>
        <Link to={`/recetas?categoria=${encodeURIComponent(categoria)}`} className="enlace-ver-todas">
          Ver todas <span className="solo-lectores">las recetas de {categoria}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid-recetas grid-recetas-compacto">
        {destacadas.map((receta) => (
          <RecetaCard key={receta.id} receta={receta} esFavorito={esFavorito} alFavorito={alFavorito} />
        ))}
      </div>
    </section>
  )
}

export default SeccionCategoria
