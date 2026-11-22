import { Link } from 'react-router-dom'
import { ChevronRight, Moon, Plus, Sun, Sunrise } from 'lucide-react'
import { iconoDeCategoria } from '../data/catalogo'
import Avatar from './Avatar'
import './ComidaSlot.css'

const ICONOS_MOMENTO = { desayuno: Sunrise, almuerzo: Sun, cena: Moon }

// Una comida del menú (desayuno, almuerzo o cena de un día). Vacía, invita a
// elegir; con platos (puede haber varios, como sopa y plato fuerte), muestra
// cada uno con su foto y quién lo eligió, deja cambiarlo y agregar otro.
function ComidaSlot({ momento, items = [], recetaPorId, usuarioId, alAgregar, alCambiar }) {
  const IconoMomento = ICONOS_MOMENTO[momento.clave]
  const etiqueta = momento.etiqueta.toLowerCase()
  const platos = items.map((item) => ({ item, receta: recetaPorId(item.receta_id) })).filter((p) => p.receta)

  return (
    <div className="comida-slot">
      <span className="comida-slot-momento">
        <IconoMomento size={16} aria-hidden="true" />
        {momento.etiqueta}
      </span>
      {platos.length === 0 ? (
        <button type="button" className="comida-slot-vacio" onClick={alAgregar}>
          <Plus size={18} aria-hidden="true" />
          Elegir {etiqueta}
        </button>
      ) : (
        <>
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
          <button type="button" className="comida-slot-otro" onClick={alAgregar}>
            <Plus size={16} aria-hidden="true" />
            Agregar otro plato
          </button>
        </>
      )}
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
