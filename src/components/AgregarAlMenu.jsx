import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { MOMENTOS } from '../data/catalogo'
import { useRecetas } from '../context/RecetasContext'
import { DIAS_SEMANA, useMenuSemanal } from '../hooks/useMenuSemanal'
import { fechaISO, indiceEnSemana, lunesDe, sumarDias } from '../utils/fechas'
import Cargando from './Cargando'
import './SelectorReceta.css'
import './AgregarAlMenu.css'

// Momento que más le va a cada categoría (se puede cambiar en la hoja).
function momentoSugerido(categoria) {
  if (categoria === 'Desayunos') return 'desayuno'
  if (categoria === 'Cenas') return 'cena'
  return 'almuerzo'
}

// Hoja para poner esta receta en el menú de la familia: semana, día y comida.
// Muestra qué hay ya en cada comida para que se sepa qué se reemplaza.
function AgregarAlMenu({ receta, alAgregar, alCerrar }) {
  const dialogoRef = useRef(null)
  const lunesActual = useMemo(() => lunesDe(new Date()), [])
  const [semana, setSemana] = useState(0) // 0 = esta semana, 1 = la próxima

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  const lunes = semana === 0 ? lunesActual : sumarDias(lunesActual, 7)

  return (
    <dialog
      ref={dialogoRef}
      className="selector-receta"
      aria-labelledby="agregar-menu-titulo"
      onClose={alCerrar}
      onClick={(evento) => {
        if (evento.target === dialogoRef.current) dialogoRef.current.close()
      }}
    >
      <div className="selector-receta-hoja">
        <div className="selector-receta-cabecera">
          <div>
            <h2 id="agregar-menu-titulo">Agregar al menú</h2>
            <p className="agregar-menu-receta">{receta.nombre}</p>
          </div>
          <button
            type="button"
            className="selector-receta-cerrar"
            onClick={() => dialogoRef.current.close()}
            aria-label="Cerrar"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="agregar-menu-semanas" role="group" aria-label="Semana">
          {['Esta semana', 'La próxima'].map((etiqueta, indice) => (
            <button
              key={etiqueta}
              type="button"
              className="selector-receta-filtro"
              aria-pressed={semana === indice}
              onClick={() => setSemana(indice)}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <Eleccion
          key={fechaISO(lunes)}
          lunes={lunes}
          esSemanaActual={semana === 0}
          receta={receta}
          alAgregar={(texto) => {
            alAgregar(texto)
            dialogoRef.current.close()
          }}
        />
      </div>
    </dialog>
  )
}

function Eleccion({ lunes, esSemanaActual, receta, alAgregar }) {
  const { recetaPorId } = useRecetas()
  const { menu, cargando, error, seleccionarReceta } = useMenuSemanal(lunes)
  const [dia, setDia] = useState(esSemanaActual ? indiceEnSemana(new Date()) : 0)
  const [momento, setMomento] = useState(momentoSugerido(receta.categoria))
  const [guardando, setGuardando] = useState(false)

  if (cargando) return <Cargando texto="Cargando el menú…" />

  const fecha = sumarDias(lunes, dia)
  const etiquetaMomento = MOMENTOS.find((m) => m.clave === momento).etiqueta.toLowerCase()
  // «el desayuno», «el almuerzo», «la cena»: el artículo va con la comida.
  const articulo = momento === 'cena' ? 'la' : 'el'
  const cual = `${etiquetaMomento} del ${DIAS_SEMANA[dia].toLowerCase()} ${fecha.getDate()}`
  const destino = `${articulo} ${cual}` // «el almuerzo del martes 10»
  const agregarA = articulo === 'el' ? `al ${cual}` : `a la ${cual}` // «a el» se contrae en «al»
  const actual = menu[dia][momento]
  const yaEsta = actual?.receta_id === receta.id

  async function agregar() {
    setGuardando(true)
    const guardado = await seleccionarReceta(dia, momento, receta.id)
    setGuardando(false)
    if (guardado) alAgregar(destino)
  }

  return (
    <div className="agregar-menu-cuerpo">
      <p className="agregar-menu-paso" id="agregar-menu-dia">
        Día
      </p>
      <div className="agregar-menu-dias" role="group" aria-labelledby="agregar-menu-dia">
        {DIAS_SEMANA.map((nombre, indice) => {
          const fechaDia = sumarDias(lunes, indice)
          const esHoy = fechaISO(fechaDia) === fechaISO(new Date())
          return (
            <button
              key={nombre}
              type="button"
              className={`menu-semanal-dia ${esHoy ? 'es-hoy' : ''}`}
              aria-pressed={dia === indice}
              aria-label={`${nombre} ${fechaDia.getDate()}${esHoy ? ', hoy' : ''}`}
              onClick={() => setDia(indice)}
            >
              <span>{nombre.slice(0, 3)}</span>
              <strong>{fechaDia.getDate()}</strong>
              <span className="menu-semanal-dia-puntos" aria-hidden="true">
                {MOMENTOS.map(({ clave }) => (
                  <i key={clave} className={menu[indice][clave] ? 'lleno' : ''} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <p className="agregar-menu-paso" id="agregar-menu-momento">
        Comida
      </p>
      <div className="agregar-menu-momentos" role="radiogroup" aria-labelledby="agregar-menu-momento">
        {MOMENTOS.map(({ clave, etiqueta }) => {
          const item = menu[dia][clave]
          const ocupada = item && recetaPorId(item.receta_id)
          return (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={momento === clave}
              className="agregar-menu-momento"
              onClick={() => setMomento(clave)}
            >
              <strong>{etiqueta}</strong>
              <span>{ocupada ? ocupada.nombre : 'Libre'}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="selector-receta-pie">
        {actual && !yaEsta && (
          <p className="agregar-menu-aviso">Reemplaza lo que hay ahora en esa comida, para toda la familia.</p>
        )}
        <button
          type="button"
          className="boton boton-primario"
          onClick={agregar}
          disabled={guardando || yaEsta}
        >
          {yaEsta ? `Ya está en ${destino}` : `Agregar ${agregarA}`}
        </button>
      </div>
    </div>
  )
}

export default AgregarAlMenu
