import { Heart } from 'lucide-react'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import RecetaCard from '../components/RecetaCard'
import EstadoVacio from '../components/EstadoVacio'

// Página de Favoritos: muestra solo las recetas que el usuario marcó con el corazón.
function Favoritos() {
  const { favoritos, esFavorito, alternarFavorito } = useFavoritos()
  const { recetas } = useRecetas()
  const recetasFavoritas = recetas.filter((receta) => favoritos.includes(receta.id))

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <div>
            <span className="etiqueta-seccion">Guardadas por ti</span>
            <h1>Mis favoritos</h1>
          </div>
        </div>

        {recetasFavoritas.length > 0 ? (
          <div className="grid-recetas">
            {recetasFavoritas.map((receta) => (
              <RecetaCard
                key={receta.id}
                receta={receta}
                esFavorito={esFavorito}
                alFavorito={alternarFavorito}
              />
            ))}
          </div>
        ) : (
          <EstadoVacio
            icono={Heart}
            titulo="Aún no tienes recetas favoritas"
            mensaje="Marca el corazón de cualquier receta para guardarla aquí y encontrarla rápido después."
          />
        )}
      </div>
    </div>
  )
}

export default Favoritos
