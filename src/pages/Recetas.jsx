import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { CATEGORIAS, DIFICULTADES, iconoDeCategoria } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import Cargando from '../components/Cargando'
import RecetaCard from '../components/RecetaCard'
import EstadoVacio from '../components/EstadoVacio'
import './Recetas.css'

// Tiempo de preparación: el valor es el máximo de minutos, salvo "mas60".
const OPCIONES_TIEMPO = [
  { etiqueta: 'Hasta 15 min', valor: '15' },
  { etiqueta: 'Hasta 30 min', valor: '30' },
  { etiqueta: 'Hasta 1 hora', valor: '60' },
  { etiqueta: 'Más de 1 hora', valor: 'mas60' },
]

// Quita tildes y mayúsculas: «limon» encuentra «Limón».
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function cumpleTiempo(receta, tiempo) {
  if (!tiempo) return true
  if (tiempo === 'mas60') return receta.tiempoPreparacion > 60
  return receta.tiempoPreparacion <= Number(tiempo)
}

// Recetario con buscador y filtros. Los filtros viven en la URL
// (?q=…&categoria=…&dificultad=…&tiempo=…&familia=1): así la búsqueda del
// encabezado funciona aunque ya estés aquí, y volver atrás conserva lo elegido.
function Recetas() {
  const [parametros, setParametros] = useSearchParams()
  const { esFavorito, alternarFavorito } = useFavoritos()
  const { recetas, cargando, error } = useRecetas()
  const { usuario } = useAuth()

  const busqueda = parametros.get('q') || ''
  const categoria = parametros.get('categoria') || ''
  const dificultad = parametros.get('dificultad') || ''
  const tiempo = parametros.get('tiempo') || ''
  const soloFamilia = parametros.get('familia') === '1'
  const filtrosExtra = (dificultad ? 1 : 0) + (tiempo ? 1 : 0)
  const [panelAbierto, setPanelAbierto] = useState(filtrosExtra > 0)

  function cambiar(clave, valor) {
    setParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
        return nuevos
      },
      { replace: true }
    )
  }

  function limpiarFiltros() {
    setParametros({}, { replace: true })
  }

  // Todo menos la categoría: así cada píldora dice cuántas recetas mostraría.
  const sinCategoria = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return recetas.filter(
      (receta) =>
        (!texto ||
          normalizar(receta.nombre).includes(texto) ||
          receta.ingredientes.some((ing) => normalizar(ing.nombre).includes(texto))) &&
        (!dificultad || receta.dificultad === dificultad) &&
        cumpleTiempo(receta, tiempo) &&
        (!soloFamilia || receta.familiaId)
    )
  }, [recetas, busqueda, dificultad, tiempo, soloFamilia])

  const recetasFiltradas = categoria ? sinCategoria.filter((r) => r.categoria === categoria) : sinCategoria

  const conteoPorCategoria = useMemo(() => {
    const conteo = {}
    sinCategoria.forEach((receta) => {
      conteo[receta.categoria] = (conteo[receta.categoria] || 0) + 1
    })
    return conteo
  }, [sinCategoria])

  const hayRecetasFamilia = recetas.some((receta) => receta.familiaId)
  const hayFiltros = busqueda || categoria || dificultad || tiempo || soloFamilia

  return (
    <div className="contenido-pagina">
      <div className="contenedor recetas">
        <header className="recetas-cabecera">
          <h1>Recetas</h1>
          <Link
            to={usuario ? '/recetas/nueva' : '/ingresar'}
            state={{ desde: '/recetas/nueva' }}
            className="boton boton-secundario boton-chico"
          >
            <Plus aria-hidden="true" /> Nueva receta
          </Link>
        </header>

        {/* Buscador y categorías quedan a mano mientras se baja por la lista. */}
        <div className="recetas-barra">
          <div className="recetas-busqueda" role="search">
            <div className="filtro-busqueda">
              <label htmlFor="filtro-texto" className="solo-lectores">
                Buscar por nombre o ingrediente
              </label>
              <Search size={20} aria-hidden="true" />
              <input
                id="filtro-texto"
                type="search"
                className="campo-formulario"
                placeholder="Nombre o ingrediente"
                value={busqueda}
                onChange={(e) => cambiar('q', e.target.value)}
              />
            </div>
            <button
              type="button"
              className="recetas-boton-filtros"
              aria-expanded={panelAbierto}
              aria-controls="recetas-panel-filtros"
              onClick={() => setPanelAbierto((abierto) => !abierto)}
            >
              <SlidersHorizontal size={20} aria-hidden="true" />
              <span className="recetas-boton-filtros-texto">Filtros</span>
              {filtrosExtra > 0 && (
                <span className="recetas-boton-filtros-cuenta">
                  {filtrosExtra}
                  <span className="solo-lectores"> activos</span>
                </span>
              )}
            </button>
          </div>

          <div className="filtros-categorias" role="group" aria-label="Categoría">
            <button
              type="button"
              className="filtro-pildora"
              aria-pressed={!categoria}
              onClick={() => cambiar('categoria', '')}
            >
              Todas <span className="filtro-pildora-cuenta">{sinCategoria.length}</span>
            </button>
            {hayRecetasFamilia && (
              <button
                type="button"
                className="filtro-pildora filtro-pildora-familia"
                aria-pressed={soloFamilia}
                onClick={() => cambiar('familia', soloFamilia ? '' : '1')}
              >
                De mi familia
              </button>
            )}
            {CATEGORIAS.map((cat) => {
              const Icono = iconoDeCategoria(cat)
              const cantidad = conteoPorCategoria[cat] || 0
              if (cantidad === 0 && categoria !== cat) return null
              return (
                <button
                  key={cat}
                  type="button"
                  className="filtro-pildora"
                  aria-pressed={categoria === cat}
                  onClick={() => cambiar('categoria', categoria === cat ? '' : cat)}
                >
                  <Icono size={18} aria-hidden="true" />
                  {cat} <span className="filtro-pildora-cuenta">{cantidad}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div id="recetas-panel-filtros" className="recetas-panel" hidden={!panelAbierto}>
          <GrupoFiltro
            titulo="Tiempo"
            opciones={OPCIONES_TIEMPO}
            valor={tiempo}
            alCambiar={(valor) => cambiar('tiempo', valor)}
          />
          <GrupoFiltro
            titulo="Dificultad"
            opciones={DIFICULTADES.map((dif) => ({ etiqueta: dif, valor: dif }))}
            valor={dificultad}
            alCambiar={(valor) => cambiar('dificultad', valor)}
          />
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
            titulo={busqueda.trim() ? `No hay recetas con «${busqueda.trim()}»` : 'No hay recetas con esos filtros'}
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

// Un grupo de píldoras de una sola elección; tocar la elegida la quita.
function GrupoFiltro({ titulo, opciones, valor, alCambiar }) {
  return (
    <div className="recetas-panel-grupo" role="group" aria-label={titulo}>
      <p>{titulo}</p>
      <div>
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            className="filtro-pildora filtro-pildora-chica"
            aria-pressed={valor === opcion.valor}
            onClick={() => alCambiar(valor === opcion.valor ? '' : opcion.valor)}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Recetas
