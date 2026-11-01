import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, SearchX, X } from 'lucide-react'
import { CATEGORIAS, DIFICULTADES, iconoDeCategoria } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import Cargando from '../components/Cargando'
import RecetaCard from '../components/RecetaCard'
import EstadoVacio from '../components/EstadoVacio'
import './Recetas.css'

// Opciones del filtro de tiempo. "mas60" es un caso especial (más de 60 minutos),
// el resto son minutos máximos de preparación.
const OPCIONES_TIEMPO = [
  { etiqueta: 'Cualquier tiempo', valor: '' },
  { etiqueta: 'Hasta 15 minutos', valor: '15' },
  { etiqueta: 'Hasta 30 minutos', valor: '30' },
  { etiqueta: 'Hasta 45 minutos', valor: '45' },
  { etiqueta: 'Hasta 60 minutos', valor: '60' },
  { etiqueta: 'Más de 60 minutos', valor: 'mas60' },
]

// Catálogo completo de recetas con buscador y filtros.
// Los filtros iniciales pueden venir por la URL (?q=...&categoria=...), por ejemplo
// cuando se llega desde el buscador del Header o de la página de Inicio.
function Recetas() {
  const [parametrosURL] = useSearchParams()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const { recetas, cargando, error } = useRecetas()
  const { usuario } = useAuth()
  const [soloFamilia, setSoloFamilia] = useState(false)

  const [busqueda, setBusqueda] = useState(parametrosURL.get('q') || '')
  const [categoria, setCategoria] = useState(parametrosURL.get('categoria') || '')
  const [dificultad, setDificultad] = useState('')
  const [tiempo, setTiempo] = useState('')

  const recetasFiltradas = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase()

    return recetas.filter((receta) => {
      const coincideTexto =
        !textoBusqueda ||
        receta.nombre.toLowerCase().includes(textoBusqueda) ||
        receta.ingredientes.some((ing) => ing.nombre.toLowerCase().includes(textoBusqueda))

      const coincideCategoria = !categoria || receta.categoria === categoria
      const coincideDificultad = !dificultad || receta.dificultad === dificultad

      let coincideTiempo = true
      if (tiempo === 'mas60') {
        coincideTiempo = receta.tiempoPreparacion > 60
      } else if (tiempo) {
        coincideTiempo = receta.tiempoPreparacion <= Number(tiempo)
      }

      const coincideOrigen = !soloFamilia || receta.familiaId

      return coincideTexto && coincideCategoria && coincideDificultad && coincideTiempo && coincideOrigen
    })
  }, [recetas, busqueda, categoria, dificultad, tiempo, soloFamilia])

  const hayRecetasFamilia = recetas.some((receta) => receta.familiaId)

  function limpiarFiltros() {
    setBusqueda('')
    setCategoria('')
    setDificultad('')
    setTiempo('')
    setSoloFamilia(false)
  }

  // Cuántas recetas hay por categoría (respetando los demás filtros).
  const conteoPorCategoria = useMemo(() => {
    const conteo = {}
    recetas.forEach((receta) => {
      conteo[receta.categoria] = (conteo[receta.categoria] || 0) + 1
    })
    return conteo
  }, [recetas])

  const hayFiltros = busqueda || categoria || dificultad || tiempo || soloFamilia

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <div>
            <span className="etiqueta-seccion">Recetario</span>
            <h1>Todas las recetas</h1>
          </div>
          <Link
            to={usuario ? '/recetas/nueva' : '/ingresar'}
            state={{ desde: '/recetas/nueva' }}
            className="boton boton-primario"
          >
            <Plus aria-hidden="true" /> Nueva receta
          </Link>
        </div>

        {/* --- Filtros --- */}
        <div className="filtros-recetas">
          <div className="filtro-busqueda">
            <label htmlFor="filtro-texto" className="solo-lectores">
              Buscar por nombre o ingrediente
            </label>
            <Search size={20} aria-hidden="true" />
            <input
              id="filtro-texto"
              type="search"
              className="campo-formulario"
              placeholder="Buscar por nombre o ingrediente"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <label htmlFor="filtro-dificultad" className="solo-lectores">
            Dificultad
          </label>
          <select
            id="filtro-dificultad"
            className="campo-formulario"
            value={dificultad}
            onChange={(e) => setDificultad(e.target.value)}
          >
            <option value="">Cualquier dificultad</option>
            {DIFICULTADES.map((dif) => (
              <option key={dif} value={dif}>
                {dif}
              </option>
            ))}
          </select>

          <label htmlFor="filtro-tiempo" className="solo-lectores">
            Tiempo de preparación
          </label>
          <select
            id="filtro-tiempo"
            className="campo-formulario"
            value={tiempo}
            onChange={(e) => setTiempo(e.target.value)}
          >
            {OPCIONES_TIEMPO.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>

        {/* Categorías en píldoras: la elegida en tinta, las demás con borde. */}
        <div className="filtros-categorias" role="group" aria-label="Categoría">
          <button
            type="button"
            className="filtro-pildora"
            aria-pressed={!categoria}
            onClick={() => setCategoria('')}
          >
            Todas <span className="filtro-pildora-cuenta">{recetas.length}</span>
          </button>
          {CATEGORIAS.map((cat) => {
            const Icono = iconoDeCategoria(cat)
            return (
              <button
                key={cat}
                type="button"
                className="filtro-pildora"
                aria-pressed={categoria === cat}
                onClick={() => setCategoria(categoria === cat ? '' : cat)}
              >
                <Icono size={18} aria-hidden="true" />
                {cat} <span className="filtro-pildora-cuenta">{conteoPorCategoria[cat] || 0}</span>
              </button>
            )
          })}
          {hayRecetasFamilia && (
            <button
              type="button"
              className="filtro-pildora filtro-pildora-familia"
              aria-pressed={soloFamilia}
              onClick={() => setSoloFamilia((actual) => !actual)}
            >
              De mi familia
            </button>
          )}
        </div>

        <div className="filtros-resultados">
          <p aria-live="polite">
            {cargando
              ? 'Cargando recetas…'
              : `${recetasFiltradas.length} ${recetasFiltradas.length === 1 ? 'receta' : 'recetas'}`}
          </p>
          {hayFiltros && (
            <button type="button" className="filtros-limpiar" onClick={limpiarFiltros}>
              <X size={16} aria-hidden="true" /> Quitar filtros
            </button>
          )}
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        {cargando ? (
          <Cargando texto="Cargando recetas…" />
        ) : recetasFiltradas.length > 0 ? (
          <div className="grid-recetas">
            {recetasFiltradas.map((receta) => (
              <RecetaCard key={receta.id} receta={receta} esFavorito={esFavorito} alFavorito={alternarFavorito} />
            ))}
          </div>
        ) : (
          <EstadoVacio
            icono={SearchX}
            titulo="No encontramos recetas con esos filtros"
            mensaje="Prueba con otra palabra o quita algunos filtros."
          >
            <button type="button" className="boton boton-secundario" onClick={limpiarFiltros}>
              Quitar filtros
            </button>
          </EstadoVacio>
        )}
      </div>
    </div>
  )
}

export default Recetas
