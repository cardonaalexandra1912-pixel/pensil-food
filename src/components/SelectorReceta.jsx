import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Search, Trash2, X } from 'lucide-react'
import { CATEGORIAS, iconoDeCategoria } from '../data/catalogo'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import './SelectorReceta.css'

const TODAS = 'Todas'
const FAVORITAS = 'Favoritas'

// Quita tildes y mayúsculas para que «arepa» encuentre «Arepita».
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Hoja (en móvil) o ventana (en escritorio) para elegir la receta de una
// comida del menú: búsqueda, filtro por categoría y la lista con fotos.
function SelectorReceta({ momento, titulo, recetaActualId, alElegir, alQuitar, alCerrar }) {
  const dialogoRef = useRef(null)
  const { recetas } = useRecetas()
  const { favoritos } = useFavoritos()
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState(momento === 'desayuno' ? 'Desayunos' : TODAS)

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  const filtros = useMemo(() => {
    const conRecetas = CATEGORIAS.filter((categoria) => recetas.some((receta) => receta.categoria === categoria))
    return favoritos.length > 0 ? [TODAS, FAVORITAS, ...conRecetas] : [TODAS, ...conRecetas]
  }, [recetas, favoritos])

  const visibles = useMemo(() => {
    const busqueda = normalizar(texto.trim())
    return recetas
      .filter((receta) => {
        if (busqueda) return normalizar(receta.nombre).includes(busqueda)
        if (filtro === FAVORITAS) return favoritos.includes(receta.id)
        return filtro === TODAS || receta.categoria === filtro
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [recetas, favoritos, texto, filtro])

  return (
    <dialog
      ref={dialogoRef}
      className="selector-receta"
      aria-labelledby="selector-receta-titulo"
      onClose={alCerrar}
      onClick={(evento) => {
        // Un clic en el fondo (fuera de la hoja) la cierra.
        if (evento.target === dialogoRef.current) dialogoRef.current.close()
      }}
    >
      <div className="selector-receta-hoja">
        <div className="selector-receta-cabecera">
          <h2 id="selector-receta-titulo">{titulo}</h2>
          <button
            type="button"
            className="selector-receta-cerrar"
            onClick={() => dialogoRef.current.close()}
            aria-label="Cerrar"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="selector-receta-busqueda">
          <Search size={18} aria-hidden="true" />
          <label htmlFor="selector-receta-texto" className="solo-lectores">
            Buscar receta
          </label>
          <input
            id="selector-receta-texto"
            type="search"
            className="campo-formulario"
            placeholder="Buscar receta"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>

        {!texto.trim() && (
          <div className="selector-receta-filtros" role="group" aria-label="Filtrar por categoría">
            {filtros.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="selector-receta-filtro"
                aria-pressed={filtro === opcion}
                onClick={() => setFiltro(opcion)}
              >
                {opcion}
              </button>
            ))}
          </div>
        )}

        <ul className="selector-receta-lista">
          {visibles.map((receta) => {
            const Icono = iconoDeCategoria(receta.categoria)
            const esActual = receta.id === Number(recetaActualId)
            return (
              <li key={receta.id}>
                <button
                  type="button"
                  className="selector-receta-opcion"
                  aria-current={esActual ? 'true' : undefined}
                  onClick={() => {
                    alElegir(receta.id)
                    dialogoRef.current.close()
                  }}
                >
                  {receta.imagen ? (
                    <img src={receta.imagen} alt="" loading="lazy" />
                  ) : (
                    <span className="mosaico" aria-hidden="true">
                      <Icono />
                    </span>
                  )}
                  <span className="selector-receta-opcion-texto">
                    <strong>{receta.nombre}</strong>
                    <span>
                      {receta.categoria}
                      {receta.tiempoPreparacion > 0 && (
                        <>
                          <Clock size={14} aria-hidden="true" /> {receta.tiempoPreparacion} min
                        </>
                      )}
                    </span>
                  </span>
                  {esActual && <span className="etiqueta etiqueta-dificultad-facil">Elegida</span>}
                </button>
              </li>
            )
          })}
          {visibles.length === 0 && (
            <li className="selector-receta-vacio">No hay recetas que coincidan con «{texto.trim()}».</li>
          )}
        </ul>

        {recetaActualId && (
          <div className="selector-receta-pie">
            <button
              type="button"
              className="boton boton-peligro"
              onClick={() => {
                alQuitar()
                dialogoRef.current.close()
              }}
            >
              <Trash2 aria-hidden="true" /> Quitar del menú
            </button>
          </div>
        )}
      </div>
    </dialog>
  )
}

export default SelectorReceta
