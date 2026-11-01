import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, MessageCircle, Search, ShoppingBasket } from 'lucide-react'
import { CATEGORIAS, iconoDeCategoria } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import Cargando from '../components/Cargando'
import SeccionCategoria from '../components/SeccionCategoria'
import './Inicio.css'

// Fotos del carrusel del hero: un desayuno, una crema y un almuerzo del
// recetario. Cámbialas cuando quieras; el carrusel se adapta a cuantas haya.
const FOTOS_HERO = [
  {
    url: `${import.meta.env.BASE_URL}imagenes/recetas/1.jpg?v=20261031`,
    nombre: 'Parfait de yogur griego con fresas',
    recetaId: 1,
  },
  {
    url: `${import.meta.env.BASE_URL}imagenes/recetas/11.jpg?v=20261031`,
    nombre: 'Cazuela de mariscos',
    recetaId: 11,
  },
  {
    url: `${import.meta.env.BASE_URL}imagenes/recetas/5.jpg?v=20261031`,
    nombre: 'Salmón dorado con salsa fresca de pepino',
    recetaId: 5,
  },
]

const HERO_INTERVALO_MS = 3500

const PASOS_FAMILIA = [
  { icono: CalendarDays, texto: 'Cada quien elige desayuno, almuerzo y cena de la semana.' },
  { icono: ShoppingBasket, texto: 'La lista de mercado se arma sola, lista para el PDF.' },
  { icono: MessageCircle, texto: 'Comentan las recetas y se ponen de acuerdo en quién cocina.' },
]

// Página principal: hero con la ficha de receta y el carrusel de fotos,
// categorías, la banda del menú en familia y recetas destacadas.
function Inicio() {
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const { recetas, cargando } = useRecetas()

  const [indiceHero, setIndiceHero] = useState(0)
  const heroPausadoRef = useRef(false)

  // Avanza el carrusel; se detiene con el cursor encima y no se mueve solo
  // si la persona pidió reducir el movimiento.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const intervalo = setInterval(() => {
      if (!heroPausadoRef.current) setIndiceHero((actual) => (actual + 1) % FOTOS_HERO.length)
    }, HERO_INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [])

  function manejarBusqueda(evento) {
    evento.preventDefault()
    const parametros = new URLSearchParams()
    if (texto.trim()) parametros.set('q', texto.trim())
    if (categoria) parametros.set('categoria', categoria)
    navigate(`/recetas?${parametros.toString()}`)
  }

  const fotoActual = FOTOS_HERO[indiceHero]

  return (
    <div className="contenido-pagina">
      {/* --- Hero --- */}
      <section className="hero ficha-receta" aria-labelledby="hero-titulo">
        <div className="contenedor hero-interior">
          <div className="hero-texto">
            <span className="etiqueta-seccion">Recetas caseras para toda la familia</span>
            <h1 id="hero-titulo">
              Encuentra tu próxima receta <span className="subrayado">favorita</span>
            </h1>
            <p className="texto-intro">
              Recetas fáciles de seguir, el menú de la semana que arman entre todos y la lista de
              mercado hecha sola.
            </p>

            <form className="hero-buscador" onSubmit={manejarBusqueda} role="search">
              <label htmlFor="hero-busqueda" className="solo-lectores">
                Buscar receta por nombre o ingrediente
              </label>
              <input
                id="hero-busqueda"
                type="search"
                className="campo-formulario"
                placeholder="Arroz con pollo, crema, salmón…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <label htmlFor="hero-categoria" className="solo-lectores">
                Categoría
              </label>
              <select
                id="hero-categoria"
                className="campo-formulario"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button type="submit" className="boton boton-primario">
                <Search aria-hidden="true" /> Buscar recetas
              </button>
            </form>
          </div>

          <div
            className="hero-fotos"
            onMouseEnter={() => (heroPausadoRef.current = true)}
            onMouseLeave={() => (heroPausadoRef.current = false)}
          >
            <div className="hero-foto-marco">
              {FOTOS_HERO.map((foto, indice) => (
                <img
                  key={foto.url}
                  src={foto.url}
                  alt=""
                  className={`hero-foto ${indice === indiceHero ? 'activo' : ''}`}
                />
              ))}
              <Link to={`/recetas/${fotoActual.recetaId}`} className="hero-foto-nombre">
                {fotoActual.nombre}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="hero-dots" role="group" aria-label="Elegir foto">
              {FOTOS_HERO.map((foto, indice) => (
                <button
                  key={foto.url}
                  type="button"
                  aria-pressed={indice === indiceHero}
                  aria-label={`Ver ${foto.nombre}`}
                  className={`hero-dot ${indice === indiceHero ? 'activo' : ''}`}
                  onClick={() => setIndiceHero(indice)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Categorías --- */}
      <section className="contenedor inicio-categorias" aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="solo-lectores">
          Categorías
        </h2>
        <ul className="categorias-lista">
          {CATEGORIAS.map((cat) => {
            const Icono = iconoDeCategoria(cat)
            const cantidad = recetas.filter((r) => r.categoria === cat).length
            return (
              <li key={cat}>
                <Link to={`/recetas?categoria=${encodeURIComponent(cat)}`} className="categoria-chip">
                  <span className="mosaico">
                    <Icono aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{cat}</strong>
                    {!cargando && <small>{cantidad} {cantidad === 1 ? 'receta' : 'recetas'}</small>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* --- Banda: el menú se planea en familia --- */}
      <section className="contenedor" aria-labelledby="titulo-familia">
        <div className="banda-familia">
          <div>
            <span className="etiqueta-seccion">Menú semanal en familia</span>
            <h2 id="titulo-familia">La semana se planea entre todos</h2>
            <p>
              Crea tu familia, comparte el código y cada integrante entra con su cuenta.
            </p>
            <Link to={usuario ? '/menu-semanal' : '/ingresar'} state={{ desde: '/menu-semanal' }} className="boton boton-primario">
              Planear la semana <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <ol className="banda-familia-pasos">
            {PASOS_FAMILIA.map(({ icono: Icono, texto: textoPaso }, indice) => (
              <li key={textoPaso}>
                <span className={`banda-paso-numero ${indice === PASOS_FAMILIA.length - 1 ? 'ultimo' : ''}`}>
                  <Icono aria-hidden="true" />
                </span>
                {textoPaso}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- Recetas destacadas por categoría --- */}
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <div>
            <span className="etiqueta-seccion">Del recetario</span>
            <h2>Cocina con amor, sirve felicidad</h2>
          </div>
        </div>

        {cargando && <Cargando texto="Cargando recetas…" />}

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
