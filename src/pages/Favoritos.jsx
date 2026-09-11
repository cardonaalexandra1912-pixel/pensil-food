import { recetas } from '../data/recetas'
import { useFavoritos } from '../hooks/useFavoritos'
import RecetaCard from '../components/RecetaCard'
import EstadoVacio from '../components/EstadoVacio'

// Página de Favoritos: muestra solo las recetas que el usuario marcó con el corazón.
function Favoritos() {
  const { favoritos, esFavorito, alternarFavorito } = useFavoritos()
  const recetasFavoritas = recetas.filter((receta) => favoritos.includes(receta.id))

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <h1>Mis Favoritos</h1>
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
            icono="♡"
            titulo="Aún no tienes recetas favoritas"
            mensaje="Marca el corazón de cualquier receta para guardarla aquí y encontrarla rápido después."
          />
        )}
      </div>
    </div>
  )
}

export default Favoritos
