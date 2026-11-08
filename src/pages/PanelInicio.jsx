import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Plus, ShoppingBasket } from 'lucide-react'
import { CATEGORIAS, MOMENTOS, iconoDeCategoria } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useRecetas } from '../context/RecetasContext'
import { DIAS_SEMANA, recetasDelMenu, useMenuSemanal } from '../hooks/useMenuSemanal'
import { agruparIngredientes } from '../utils/ingredientes'
import { indiceEnSemana, lunesDe, textoDia } from '../utils/fechas'
import AvisoSinFamilia from '../components/AvisoSinFamilia'
import Cargando from '../components/Cargando'
import ComidaSlot from '../components/ComidaSlot'
import SelectorReceta from '../components/SelectorReceta'
import './PanelInicio.css'

const COMIDAS_POR_SEMANA = DIAS_SEMANA.length * MOMENTOS.length

// Inicio con sesión: lo que hay hoy en casa, cómo va la semana y atajos a
// lo que la familia usa a diario. El catálogo completo queda en «Recetas».
function PanelInicio() {
  const { perfil, usuario, familia } = useAuth()
  const hoy = useMemo(() => new Date(), [])
  const nombre = (perfil?.nombre || usuario?.email || '').split(/[\s@]/)[0]
  const fecha = textoDia(hoy)

  return (
    <div className="contenido-pagina">
      <div className="contenedor panel">
        <header className="panel-saludo">
          <p>{fecha.charAt(0).toUpperCase() + fecha.slice(1)}</p>
          <h1>Hola, {nombre}</h1>
        </header>

        {familia ? (
          <HoyEnCasa hoy={hoy} />
        ) : (
          <AvisoSinFamilia mensaje="Crea tu familia o únete con un código para planear el menú de la semana entre todos." />
        )}

        <Favoritas />
        <Explorar />
      </div>
    </div>
  )
}

function HoyEnCasa({ hoy }) {
  const { usuario, familia } = useAuth()
  const { recetaPorId } = useRecetas()
  const lunes = useMemo(() => lunesDe(hoy), [hoy])
  const { menu, cargando, error, seleccionarReceta } = useMenuSemanal(lunes)
  const [eligiendo, setEligiendo] = useState(null) // clave del momento mientras la hoja está abierta
  const dia = indiceEnSemana(hoy)

  const recetasSemana = useMemo(() => recetasDelMenu(menu, recetaPorId), [menu, recetaPorId])
  const ingredientes = useMemo(
    () => agruparIngredientes(recetasSemana.flatMap((receta) => receta.ingredientes)).length,
    [recetasSemana]
  )

  if (cargando) return <Cargando texto="Cargando el menú de hoy…" />

  const planeadas = recetasSemana.length
  const momentoEligiendo = MOMENTOS.find((m) => m.clave === eligiendo)

  return (
    <>
      <section className="panel-hoy ficha-receta" aria-labelledby="panel-hoy-titulo">
        <div className="panel-hoy-cabecera">
          <h2 id="panel-hoy-titulo">Hoy en casa</h2>
          <span>{familia.nombre}</span>
        </div>
        {error && <p className="mensaje-error">{error}</p>}
        <div className="panel-hoy-comidas">
          {MOMENTOS.map((momento) => {
            const item = menu[dia][momento.clave]
            return (
              <ComidaSlot
                key={momento.clave}
                momento={momento}
                item={item}
                receta={item && recetaPorId(item.receta_id)}
                usuarioId={usuario?.id}
                alAbrir={() => setEligiendo(momento.clave)}
              />
            )
          })}
        </div>
      </section>

      <div className="panel-atajos">
        <Link to="/menu-semanal" className="panel-atajo">
          <span className="mosaico" aria-hidden="true">
            <CalendarDays />
          </span>
          <span className="panel-atajo-texto">
            <strong>Menú de la semana</strong>
            <span>
              {planeadas === 0
                ? 'Todavía no hay comidas elegidas'
                : `${planeadas} de ${COMIDAS_POR_SEMANA} comidas planeadas`}
            </span>
            <span className="barra-progreso" aria-hidden="true">
              <span style={{ width: `${(planeadas / COMIDAS_POR_SEMANA) * 100}%` }} />
            </span>
          </span>
          <ArrowRight className="panel-atajo-flecha" aria-hidden="true" />
        </Link>
        <Link to="/menu-semanal#lista-mercado" className="panel-atajo">
          <span className="mosaico" aria-hidden="true">
            <ShoppingBasket />
          </span>
          <span className="panel-atajo-texto">
            <strong>Lista de mercado</strong>
            <span>
              {ingredientes === 0
                ? 'Se arma sola cuando elijan comidas'
                : `${ingredientes} ${ingredientes === 1 ? 'ingrediente' : 'ingredientes'} por comprar`}
            </span>
          </span>
          <ArrowRight className="panel-atajo-flecha" aria-hidden="true" />
        </Link>
      </div>

      {eligiendo && (
        <SelectorReceta
          momento={eligiendo}
          titulo={`${momentoEligiendo.etiqueta} de hoy`}
          recetaActualId={menu[dia][eligiendo]?.receta_id}
          alElegir={(recetaId) => seleccionarReceta(dia, eligiendo, recetaId)}
          alQuitar={() => seleccionarReceta(dia, eligiendo, '')}
          alCerrar={() => setEligiendo(null)}
        />
      )}
    </>
  )
}

// Fila deslizable con las recetas favoritas, para tenerlas a un toque.
function Favoritas() {
  const { favoritos } = useFavoritos()
  const { recetaPorId } = useRecetas()
  const recetas = favoritos.map((id) => recetaPorId(id)).filter(Boolean)

  return (
    <section className="panel-seccion" aria-labelledby="panel-favoritas-titulo">
      <div className="panel-seccion-cabecera">
        <h2 id="panel-favoritas-titulo">Tus favoritas</h2>
        {recetas.length > 0 && (
          <Link to="/favoritos" className="enlace-ver-todas">
            Ver todas
          </Link>
        )}
      </div>
      {recetas.length === 0 ? (
        <p className="panel-vacio">
          Toca el corazón de una receta para guardarla aquí.{' '}
          <Link to="/recetas" className="enlace-ver-todas">
            Explorar recetas
          </Link>
        </p>
      ) : (
        <ul className="panel-favoritas">
          {recetas.map((receta) => {
            const Icono = iconoDeCategoria(receta.categoria)
            return (
              <li key={receta.id}>
                <Link to={`/recetas/${receta.id}`} className="panel-favorita">
                  {receta.imagen ? (
                    <img src={receta.imagen} alt="" loading="lazy" />
                  ) : (
                    <span className="panel-favorita-sin-foto ficha-receta" aria-hidden="true">
                      <span className="mosaico">
                        <Icono />
                      </span>
                    </span>
                  )}
                  <strong>{receta.nombre}</strong>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Explorar() {
  const { recetas } = useRecetas()
  const { familia } = useAuth()
  const deLaFamilia = recetas.filter((receta) => receta.familiaId).length

  return (
    <section className="panel-seccion" aria-labelledby="panel-explorar-titulo">
      <div className="panel-seccion-cabecera">
        <h2 id="panel-explorar-titulo">Explorar el recetario</h2>
        {familia && (
          <Link to="/recetas/nueva" className="boton boton-secundario boton-chico">
            <Plus aria-hidden="true" /> Nueva receta
          </Link>
        )}
      </div>
      {deLaFamilia > 0 && (
        <p className="panel-vacio">
          Tu familia ya guardó {deLaFamilia} {deLaFamilia === 1 ? 'receta propia' : 'recetas propias'}.
        </p>
      )}
      <ul className="categorias-lista">
        {CATEGORIAS.map((categoria) => {
          const Icono = iconoDeCategoria(categoria)
          const cantidad = recetas.filter((r) => r.categoria === categoria).length
          return (
            <li key={categoria}>
              <Link to={`/recetas?categoria=${encodeURIComponent(categoria)}`} className="categoria-chip">
                <span className="mosaico">
                  <Icono aria-hidden="true" />
                </span>
                <span>
                  <strong>{categoria}</strong>
                  <small>
                    {cantidad} {cantidad === 1 ? 'receta' : 'recetas'}
                  </small>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default PanelInicio
