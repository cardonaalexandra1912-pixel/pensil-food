import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIAS, recetas } from '../data/recetas'
import { useFavoritos } from '../hooks/useFavoritos'
import SeccionCategoria from '../components/SeccionCategoria'
import './Inicio.css'

// Imágenes de fondo del carrusel del hero. Cámbialas por tus propias fotos
// cuando quieras (misma URL de estilo `${BASE_URL}imagenes/...` o cualquier
// URL externa) — el carrusel se adapta automáticamente a cuantas pongas aquí.
const heroImages = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1600&q=80',
]

const HERO_INTERVALO_MS = 5500

// Página principal: hero con carrusel de fondo + buscador, y secciones de
// recetas destacadas por categoría.
function Inicio() {
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')
  const navigate = useNavigate()
  const { esFavorito, alternarFavorito } = useFavoritos()

  const [indiceHero, setIndiceHero] = useState(0)
  const heroPausadoRef = useRef(false)

  // Avanza el carrusel automáticamente; se salta el avance mientras el mouse
  // está encima (heroPausadoRef), sin necesidad de reiniciar el intervalo.
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (!heroPausadoRef.current) {
        setIndiceHero((actual) => (actual + 1) % heroImages.length)
      }
    }, HERO_INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [])

  // Al enviar el formulario, mandamos al usuario a /recetas con los filtros ya aplicados
  function manejarBusqueda(evento) {
    evento.preventDefault()
    const parametros = new URLSearchParams()
    if (texto.trim()) parametros.set('q', texto.trim())
    if (categoria) parametros.set('categoria', categoria)
    navigate(`/recetas?${parametros.toString()}`)
  }

  return (
    <div className="contenido-pagina">
      {/* --- Hero --- */}
      <section
        className="hero"
        onMouseEnter={() => (heroPausadoRef.current = true)}
        onMouseLeave={() => (heroPausadoRef.current = false)}
      >
        <div className="hero-fondos">
          {heroImages.map((imagen, indice) => (
            <div
              key={imagen}
              className={`hero-fondo ${indice === indiceHero ? 'activo' : ''}`}
              style={{ backgroundImage: `url(${imagen})` }}
            />
          ))}
        </div>
        <div className="hero-degradado" />
        <div className="hero-overlay" />
        <div className="contenedor hero-contenido">
          <h1>Encuentra tu próxima receta favorita</h1>
          <p className="hero-subtitulo">
            Recetas caseras organizadas por categoría, fáciles de seguir y siempre a mano.
          </p>

          <form className="hero-buscador" onSubmit={manejarBusqueda}>
            <input
              type="text"
              className="campo-formulario"
              placeholder="Buscar por nombre, ej. 'arroz con pollo'"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <select
              className="campo-formulario"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button type="submit" className="boton boton-primario">
              Buscar
            </button>
          </form>

          <div className="hero-dots" role="tablist" aria-label="Seleccionar imagen de fondo">
            {heroImages.map((imagen, indice) => (
              <button
                key={imagen}
                type="button"
                role="tab"
                aria-selected={indice === indiceHero}
                aria-label={`Mostrar imagen ${indice + 1} de ${heroImages.length}`}
                className={`hero-dot ${indice === indiceHero ? 'activo' : ''}`}
                onClick={() => setIndiceHero(indice)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- Recetas destacadas por categoría --- */}
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <h2>Recetas por categoría</h2>
        </div>

        {CATEGORIAS.map((cat) => (
          <SeccionCategoria
            key={cat}
            categoria={cat}
            recetas={recetas}
            esFavorito={esFavorito}
            alFavorito={alternarFavorito}
          />
        ))}
      </div>
    </div>
  )
}

export default Inicio
