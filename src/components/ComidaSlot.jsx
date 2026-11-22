import { Link } from 'react-router-dom'
import { ChevronRight, CupSoda, Moon, Plus, Sun, Sunrise } from 'lucide-react'
import { iconoDeCategoria } from '../data/catalogo'
import Avatar from './Avatar'
import './ComidaSlot.css'

const ICONOS_MOMENTO = { desayuno: Sunrise, almuerzo: Sun, cena: Moon }

// Las recetas de esta categoría son la bebida de la comida, no un plato.
export const CATEGORIA_BEBIDAS = 'Jugos y Bebidas'

export function esBebida(receta) {
  return receta?.categoria === CATEGORIA_BEBIDAS
}

// Una comida del menú (desayuno, almuerzo o cena de un día). Vacía, es una
// fila discreta que invita a elegir; con platos (puede haber varios, como sopa
// y plato fuerte), muestra cada uno con su foto y quién lo eligió, y debajo la
// bebida en una fila más pequeña. Todo se puede cambiar y se puede agregar otro
// plato o la bebida.
function ComidaSlot({ momento, items = [], recetaPorId, usuarioId, alAgregar, alAgregarBebida, alCambiar }) {
  const IconoMomento = ICONOS_MOMENTO[momento.clave]
  const etiqueta = momento.etiqueta.toLowerCase()
  const todos = items.map((item) => ({ item, receta: recetaPorId(item.receta_id) })).filter((p) => p.receta)
  const platos = todos.filter((p) => !esBebida(p.receta))
  const bebidas = todos.filter((p) => esBebida(p.receta))

  // Vacía: una sola fila con la comida y el botón para elegir, sin título aparte.
  if (todos.length === 0) {
    return (
      <div className="comida-slot">
        <button type="button" className="comida-slot-vacio" onClick={alAgregar} aria-label={`Elegir ${etiqueta}`}>
          <IconoMomento size={18} aria-hidden="true" className="comida-slot-vacio-icono" />
          <span className="comida-slot-vacio-texto">{momento.etiqueta}</span>
          <span className="comida-slot-vacio-pista">Elegir</span>
          <span className="comida-slot-vacio-mas" aria-hidden="true">
            <Plus size={16} />
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="comida-slot">
      <span className="comida-slot-momento">
        <IconoMomento size={16} aria-hidden="true" />
        {momento.etiqueta}
      </span>

      {platos.map(({ item, receta }) => (
        <Plato
          key={item.id}
          momento={momento}
          item={item}
          receta={receta}
          usuarioId={usuarioId}
          alCambiar={() => alCambiar(item)}
        />
      ))}
      {bebidas.map(({ item, receta }) => (
        <Bebida key={item.id} momento={momento} receta={receta} alCambiar={() => alCambiar(item)} />
      ))}
      <div className="comida-slot-acciones">
        <button type="button" className="comida-slot-otro" onClick={alAgregar}>
          <Plus size={16} aria-hidden="true" />
          {platos.length === 0 ? 'Plato' : 'Otro plato'}
        </button>
        {bebidas.length === 0 && alAgregarBebida && (
          <button type="button" className="comida-slot-otro" onClick={alAgregarBebida}>
            <CupSoda size={16} aria-hidden="true" />
            Bebida
          </button>
        )}
      </div>
    </div>
  )
}

// La bebida va en una fila más baja que los platos: acompaña, no protagoniza.
function Bebida({ momento, receta, alCambiar }) {
  return (
    <div className="comida-slot-bebida">
      <button
        type="button"
        className="comida-slot-bebida-cambiar"
        onClick={alCambiar}
        aria-label={`Bebida del ${momento.etiqueta.toLowerCase()}: ${receta.nombre}. Cambiar`}
      >
        <CupSoda size={18} aria-hidden="true" />
        <span>{receta.nombre}</span>
      </button>
      <Link to={`/recetas/${receta.id}`} className="comida-slot-ver" aria-label={`Ver la receta de ${receta.nombre}`}>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </div>
  )
}

function Plato({ momento, item, receta, usuarioId, alCambiar }) {
  const IconoCategoria = iconoDeCategoria(receta.categoria)
  const eligioYo = item.elegido_por === usuarioId
  const quien = eligioYo ? 'ti' : item.elegido?.nombre

  return (
    <div className="comida-slot-receta">
      <button
        type="button"
        className="comida-slot-cambiar"
        onClick={alCambiar}
        aria-label={`${momento.etiqueta}: ${receta.nombre}. Cambiar`}
      >
        {receta.imagen ? (
          <img src={receta.imagen} alt="" loading="lazy" />
        ) : (
          <span className="mosaico" aria-hidden="true">
            <IconoCategoria />
          </span>
        )}
        <span className="comida-slot-texto">
          <strong>{receta.nombre}</strong>
          {quien && (
            <span className="comida-slot-quien">
              <Avatar nombre={item.elegido?.nombre} url={item.elegido?.avatar_url} tamano={18} />
              Elegido por {quien}
            </span>
          )}
        </span>
      </button>
      <Link to={`/recetas/${receta.id}`} className="comida-slot-ver" aria-label={`Ver la receta de ${receta.nombre}`}>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
    </div>
  )
}

export default ComidaSlot
