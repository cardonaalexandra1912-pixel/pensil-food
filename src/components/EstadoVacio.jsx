import './EstadoVacio.css'

// Mensaje reutilizable para cuando una lista está vacía
// (favoritos sin recetas, lista de mercado sin ingredientes, etc.)
function EstadoVacio({ icono = '🍽️', titulo, mensaje }) {
  return (
    <div className="estado-vacio">
      <span className="estado-vacio-icono">{icono}</span>
      <h3>{titulo}</h3>
      {mensaje && <p>{mensaje}</p>}
    </div>
  )
}

export default EstadoVacio
