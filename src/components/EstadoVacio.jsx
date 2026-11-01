import { UtensilsCrossed } from 'lucide-react'
import './EstadoVacio.css'

// Mensaje reutilizable para cuando una lista está vacía. `icono` es un
// componente de lucide-react.
function EstadoVacio({ icono: Icono = UtensilsCrossed, titulo, mensaje, children }) {
  return (
    <div className="estado-vacio">
      <span className="mosaico" aria-hidden="true">
        <Icono />
      </span>
      <h2 className="estado-vacio-titulo">{titulo}</h2>
      {mensaje && <p>{mensaje}</p>}
      {children && <div className="estado-vacio-acciones">{children}</div>}
    </div>
  )
}

export default EstadoVacio
