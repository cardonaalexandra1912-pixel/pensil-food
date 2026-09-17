import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CATEGORIAS, DIFICULTADES, recetas } from '../data/recetas'
import { useFavoritos } from '../hooks/useFavoritos'
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

      return coincideTexto && coincideCategoria && coincideDificultad && coincideTiempo
    })
  }, [busqueda, categoria, dificultad, tiempo])

  function limpiarFiltros() {
    setBusqueda('')
    setCategoria('')
    setDificultad('')
    setTiempo('')
  }

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <h1>Todas las Recetas</h1>
        </div>

        {/* --- Barra de filtros --- */}
        <div className="filtros-recetas">
          <input
            type="text"
            className="campo-formulario"
            placeholder="Buscar por nombre o ingrediente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
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

          <select
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

          <select
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

          <button type="button" className="boton boton-contorno" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>

        <p className="filtros-resultados">
          {recetasFiltradas.length}{' '}
          {recetasFiltradas.length === 1 ? 'receta encontrada' : 'recetas encontradas'}
        </p>

        {/* --- Resultado --- */}
        {recetasFiltradas.length > 0 ? (
          <div className="grid-recetas">
            {recetasFiltradas.map((receta) => (
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
            icono="🔎"
            titulo="No encontramos recetas con esos filtros"
            mensaje="Intenta con otro término de búsqueda o quita algunos filtros."
          />
        )}
      </div>
    </div>
  )
}

export default Recetas
