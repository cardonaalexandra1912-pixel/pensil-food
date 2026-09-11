import { Link } from 'react-router-dom'
import RecetaCard from './RecetaCard'
import './SeccionCategoria.css'

// Fila de recetas destacadas de una categoría, con enlace a "ver todas".
// Se usa en la página de Inicio, una vez por cada categoría.
function SeccionCategoria({ categoria, recetas, esFavorito, alFavorito }) {
  // Solo mostramos hasta 4 recetas de esta categoría en la página de inicio
  const destacadas = recetas.filter((r) => r.categoria === categoria).slice(0, 4)

  if (destacadas.length === 0) return null

  return (
    <section className="seccion-categoria">
      <div className="encabezado-seccion">
        <h2>{categoria}</h2>
        <Link to={`/recetas?categoria=${encodeURIComponent(categoria)}`} className="enlace-ver-todas">
          Ver todas →
        </Link>
      </div>

      <div className="grid-recetas grid-recetas-compacto">
        {destacadas.map((receta) => (
          <RecetaCard
            key={receta.id}
            receta={receta}
            esFavorito={esFavorito}
            alFavorito={alFavorito}
          />
        ))}
      </div>
    </section>
  )
}

export default SeccionCategoria
