import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Moon, Search, ShoppingBasket, Sun, Sunrise } from 'lucide-react'
import { CATEGORIAS, iconoDeCategoria } from '../data/catalogo'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import { recetasDelMenu } from '../hooks/useMenuSemanal'
import { agruparIngredientes } from '../utils/ingredientes'
import Avatar from '../components/Avatar'
import Cargando from '../components/Cargando'
import RecetaCard from '../components/RecetaCard'
import './Inicio.css'
import './Portada.css'

// Fotos del carrusel: un desayuno, una crema y un almuerzo del recetario.
const FOTOS_HERO = [
  { url: 'imagenes/recetas/1.jpg?v=20261031', nombre: 'Parfait de yogur griego con fresas', recetaId: 1 },
  { url: 'imagenes/recetas/11.jpg?v=20261031', nombre: 'Cazuela de mariscos', recetaId: 11 },
  { url: 'imagenes/recetas/5.jpg?v=20261031', nombre: 'Salmón dorado con salsa fresca de pepino', recetaId: 5 },
]
const HERO_INTERVALO_MS = 4000

// Ejemplo de semana para la vista previa: recetas reales del catálogo, con
// quién de la familia las eligió. Si alguna ya no existe, ese plato no se pinta.
const SEMANA_EJEMPLO = [
  { dia: 'Lunes', comidas: { desayuno: [27, 'Sofía'], almuerzo: [25, 'Mamá'], cena: [37, 'Papá'] } },
  { dia: 'Martes', comidas: { desayuno: [1, 'Mamá'], almuerzo: [4, 'Sofía'], cena: [8, 'Mamá'] } },
  { dia: 'Miércoles', comidas: { desayuno: [3, 'Papá'], almuerzo: [21, 'Papá'], cena: [7, 'Sofía'] } },
]
const ICONOS_MOMENTO = { desayuno: Sunrise, almuerzo: Sun, cena: Moon }
const RECETAS_PARA_EMPEZAR = 8

function urlPublica(ruta) {
  return `${import.meta.env.BASE_URL}${ruta}`
}

// Portada para quien todavía no tiene cuenta: buscar recetas, ver cómo se
// planea la semana en familia y unas recetas para empezar.
function Portada() {
  const { recetas, recetaPorId, cargando } = useRecetas()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const catalogo = recetas.filter((receta) => !receta.familiaId)

  return (
    <div className="contenido-pagina portada">
      <Hero />

      <section className="contenedor portada-categorias" aria-labelledby="portada-categorias-titulo">
        <h2 id="portada-categorias-titulo" className="solo-lectores">
          Categorías
        </h2>
        <ul className="categorias-lista">
          {CATEGORIAS.map((categoria) => {
            const Icono = iconoDeCategoria(categoria)
            const cantidad = catalogo.filter((r) => r.categoria === categoria).length
            return (
              <li key={categoria}>
                <Link to={`/recetas?categoria=${encodeURIComponent(categoria)}`} className="categoria-chip">
                  <span className="mosaico">
                    <Icono aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{categoria}</strong>
                    {!cargando && (
                      <small>
                        {cantidad} {cantidad === 1 ? 'receta' : 'recetas'}
                      </small>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <SemanaEnFamilia recetaPorId={recetaPorId} />

      <section className="contenedor portada-empezar" aria-labelledby="portada-empezar-titulo">
        <div className="portada-seccion-cabecera">
          <h2 id="portada-empezar-titulo">Para empezar</h2>
          {catalogo.length > 0 && (
            <Link to="/recetas" className="enlace-ver-todas">
              Ver las {catalogo.length} recetas <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
        {cargando ? (
          <Cargando texto="Cargando recetas…" />
        ) : (
          <div className="grid-recetas">
            {paraEmpezar(catalogo).map((receta) => (
              <RecetaCard key={receta.id} receta={receta} esFavorito={esFavorito} alFavorito={alternarFavorito} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Una receta con foto por categoría y luego las demás, hasta completar.
function paraEmpezar(recetas) {
  const conFoto = recetas.filter((receta) => receta.imagen)
  const elegidas = CATEGORIAS.map((categoria) => conFoto.find((receta) => receta.categoria === categoria)).filter(
    Boolean
  )
  const resto = conFoto.filter((receta) => !elegidas.includes(receta))
  return [...elegidas, ...resto].slice(0, RECETAS_PARA_EMPEZAR)
}

function Hero() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [indice, setIndice] = useState(0)
  const pausadoRef = useRef(false)

  // El carrusel se detiene con el cursor encima y no se mueve si la persona
  // pidió reducir el movimiento.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const intervalo = setInterval(() => {
      if (!pausadoRef.current) setIndice((actual) => (actual + 1) % FOTOS_HERO.length)
    }, HERO_INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [])

  function buscar(evento) {
    evento.preventDefault()
    navigate(texto.trim() ? `/recetas?q=${encodeURIComponent(texto.trim())}` : '/recetas')
  }

  const foto = FOTOS_HERO[indice]

  return (
    <section className="portada-hero ficha-receta" aria-labelledby="portada-titulo">
      <div className="contenedor portada-hero-interior">
        <div className="portada-hero-texto">
          <h1 id="portada-titulo">
            Encuentra tu próxima receta <span className="subrayado">favorita</span>
          </h1>
          <p className="texto-intro">
            Recetas caseras fáciles de seguir, el menú de la semana que arman entre todos y la lista de
            mercado hecha sola.
          </p>

          <form className="portada-buscador" onSubmit={buscar} role="search">
            <label htmlFor="portada-busqueda" className="solo-lectores">
              Buscar receta por nombre o ingrediente
            </label>
            <Search size={20} aria-hidden="true" />
            <input
              id="portada-busqueda"
              type="search"
              className="campo-formulario"
              placeholder="Arroz con pollo, crema, salmón…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit" className="portada-buscador-boton">
              Buscar
            </button>
          </form>

          <div className="portada-hero-acciones">
            <Link to="/ingresar" state={{ modo: 'registro' }} className="boton boton-primario">
              Crear cuenta gratis
            </Link>
            <Link to="/ingresar" className="portada-enlace">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div
          className="portada-hero-foto"
          onMouseEnter={() => (pausadoRef.current = true)}
          onMouseLeave={() => (pausadoRef.current = false)}
        >
          {FOTOS_HERO.map((f, i) => (
            <img key={f.url} src={urlPublica(f.url)} alt="" className={i === indice ? 'activo' : ''} />
          ))}
          <Link to={`/recetas/${foto.recetaId}`} className="portada-hero-foto-nombre">
            {foto.nombre}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <div className="portada-hero-puntos" role="group" aria-label="Elegir foto">
            {FOTOS_HERO.map((f, i) => (
              <button
                key={f.url}
                type="button"
                aria-pressed={i === indice}
                aria-label={`Ver ${f.nombre}`}
                onClick={() => setIndice(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Banda grafito: lo que hace distinta la app, mostrado con una semana de ejemplo.
function SemanaEnFamilia({ recetaPorId }) {
  const ejemplo = useMemo(
    () =>
      SEMANA_EJEMPLO.map(({ dia, comidas }) => ({
        dia,
        comidas: Object.entries(comidas)
          .map(([momento, [id, quien]]) => ({ momento, receta: recetaPorId(id), quien }))
          .filter((comida) => comida.receta),
      })),
    [recetaPorId]
  )
  const ingredientes = useMemo(() => {
    const menu = ejemplo.map((dia) =>
      Object.fromEntries(dia.comidas.map((c) => [c.momento, { receta_id: c.receta.id }]))
    )
    return agruparIngredientes(recetasDelMenu(menu, recetaPorId).flatMap((r) => r.ingredientes)).length
  }, [ejemplo, recetaPorId])

  return (
    <section className="contenedor" aria-labelledby="portada-semana-titulo">
      <div className="portada-semana">
        <div className="portada-semana-texto">
          <h2 id="portada-semana-titulo">La semana se planea entre todos</h2>
          <p>
            Cada quien elige desayuno, almuerzo y cena desde su teléfono, y los demás lo ven al instante. Los
            ingredientes de toda la semana se juntan solos en la lista de mercado.
          </p>
          <Link to="/ingresar" state={{ modo: 'registro' }} className="boton boton-primario">
            Crear mi familia <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        {ejemplo.some((dia) => dia.comidas.length > 0) && (
          <figure className="portada-semana-ejemplo">
            <figcaption className="solo-lectores">
              Ejemplo de un menú semanal con lo que eligió cada integrante de la familia.
            </figcaption>
            <div className="portada-ejemplo-cabecera" aria-hidden="true">
              <strong>Esta semana</strong>
              <span>Familia Ríos</span>
            </div>
            <ol aria-hidden="true">
              {ejemplo.map(({ dia, comidas }) => (
                <li key={dia} className="portada-ejemplo-dia">
                  <span className="portada-ejemplo-nombre">{dia}</span>
                  <ul>
                    {comidas.map(({ momento, receta, quien }) => {
                      const Icono = ICONOS_MOMENTO[momento]
                      return (
                        <li key={momento}>
                          {receta.imagen ? (
                            <img src={receta.imagen} alt="" loading="lazy" />
                          ) : (
                            <span className="portada-ejemplo-sin-foto">
                              <Icono size={16} />
                            </span>
                          )}
                          <span className="portada-ejemplo-plato">{receta.nombre}</span>
                          <Avatar nombre={quien} tamano={22} />
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ol>
            {ingredientes > 0 && (
              <div className="portada-ejemplo-mercado" aria-hidden="true">
                <ShoppingBasket size={18} />
                Lista de mercado: {ingredientes} ingredientes
              </div>
            )}
          </figure>
        )}
      </div>
    </section>
  )
}

export default Portada
