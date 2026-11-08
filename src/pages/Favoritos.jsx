import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Dices, Heart } from 'lucide-react'
import { CATEGORIAS, iconoDeCategoria } from '../data/catalogo'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import Cargando from '../components/Cargando'
import RecetaCard from '../components/RecetaCard'
import './Favoritos.css'

const SUGERENCIAS = 4
const DURACION_AVISO_MS = 6000

// Favoritos: las recetas guardadas con el corazón, la última primero. Quitar
// una deja un aviso con «Deshacer» por si fue sin querer.
function Favoritos() {
  const { favoritos, esFavorito, alternarFavorito } = useFavoritos()
  const { recetas, recetaPorId, cargando } = useRecetas()
  const navigate = useNavigate()
  const [categoria, setCategoria] = useState('')
  const [quitada, setQuitada] = useState(null)

  // El aviso de «Deshacer» se va solo después de unos segundos.
  useEffect(() => {
    if (!quitada) return undefined
    const temporizador = setTimeout(() => setQuitada(null), DURACION_AVISO_MS)
    return () => clearTimeout(temporizador)
  }, [quitada])

  const guardadas = useMemo(
    () =>
      [...favoritos]
        .reverse()
        .map((id) => recetaPorId(id))
        .filter(Boolean),
    [favoritos, recetaPorId]
  )

  const categorias = CATEGORIAS.filter((cat) => guardadas.some((receta) => receta.categoria === cat))
  // Si se quita la última receta de la categoría elegida, vuelve a «Todas».
  const categoriaVigente = categorias.includes(categoria) ? categoria : ''
  const visibles = categoriaVigente ? guardadas.filter((r) => r.categoria === categoriaVigente) : guardadas

  function alternar(id) {
    if (esFavorito(id)) setQuitada(recetaPorId(id))
    else setQuitada(null)
    alternarFavorito(id)
  }

  function elegirAlAzar() {
    const receta = visibles[Math.floor(Math.random() * visibles.length)]
    if (receta) navigate(`/recetas/${receta.id}`)
  }

  if (cargando) {
    return (
      <div className="contenido-pagina">
        <Cargando texto="Cargando tus favoritas…" />
      </div>
    )
  }

  return (
    <div className="contenido-pagina">
      <div className="contenedor favoritos">
        <header className="favoritos-cabecera">
          <div>
            <h1>Favoritos</h1>
            {guardadas.length > 0 && (
              <p>
                {guardadas.length} {guardadas.length === 1 ? 'receta guardada' : 'recetas guardadas'}
              </p>
            )}
          </div>
          {visibles.length > 1 && (
            <button type="button" className="boton boton-secundario boton-chico" onClick={elegirAlAzar}>
              <Dices aria-hidden="true" /> Elegir una al azar
            </button>
          )}
        </header>

        {guardadas.length === 0 ? (
          <SinFavoritas recetas={recetas} esFavorito={esFavorito} alFavorito={alternar} />
        ) : (
          <>
            {categorias.length > 1 && (
              <div className="filtros-categorias" role="group" aria-label="Categoría">
                <button
                  type="button"
                  className="filtro-pildora"
                  aria-pressed={!categoriaVigente}
                  onClick={() => setCategoria('')}
                >
                  Todas <span className="filtro-pildora-cuenta">{guardadas.length}</span>
                </button>
                {categorias.map((cat) => {
                  const Icono = iconoDeCategoria(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      className="filtro-pildora"
                      aria-pressed={categoriaVigente === cat}
                      onClick={() => setCategoria(categoriaVigente === cat ? '' : cat)}
                    >
                      <Icono size={18} aria-hidden="true" />
                      {cat}{' '}
                      <span className="filtro-pildora-cuenta">
                        {guardadas.filter((r) => r.categoria === cat).length}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="grid-recetas">
              {visibles.map((receta) => (
                <RecetaCard key={receta.id} receta={receta} esFavorito={esFavorito} alFavorito={alternar} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="favoritos-aviso-zona" aria-live="polite">
        {quitada && (
          <div className="favoritos-aviso" role="status">
            <span>
              Quitaste <strong>{quitada.nombre}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                alternarFavorito(quitada.id)
                setQuitada(null)
              }}
            >
              Deshacer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Vacío: explica cómo se guardan y propone unas recetas para empezar ahí mismo.
function SinFavoritas({ recetas, esFavorito, alFavorito }) {
  const sugeridas = recetas.filter((receta) => receta.imagen && !receta.familiaId).slice(0, SUGERENCIAS)

  return (
    <div className="favoritos-vacio">
      <div className="favoritos-vacio-texto">
        <span className="favoritos-vacio-corazon" aria-hidden="true">
          <Heart />
        </span>
        <div>
          <h2>Guarda aquí las que más te gustan</h2>
          <p>Toca el corazón de una receta y la tendrás a mano para cocinarla o ponerla en el menú.</p>
        </div>
      </div>

      {sugeridas.length > 0 && (
        <section aria-labelledby="favoritos-sugeridas-titulo">
          <div className="favoritos-sugeridas-cabecera">
            <h3 id="favoritos-sugeridas-titulo">Para empezar</h3>
            <Link to="/recetas" className="enlace-ver-todas">
              Ver todas las recetas <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid-recetas">
            {sugeridas.map((receta) => (
              <RecetaCard key={receta.id} receta={receta} esFavorito={esFavorito} alFavorito={alFavorito} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Favoritos
