import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIAS, recetas } from '../data/recetas'
import { useFavoritos } from '../hooks/useFavoritos'
import SeccionCategoria from '../components/SeccionCategoria'
import './Inicio.css'

// Página principal: hero con buscador + secciones de recetas destacadas por categoría.
function Inicio() {
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')
  const navigate = useNavigate()
  const { esFavorito, alternarFavorito } = useFavoritos()

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
      <section className="hero">
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
