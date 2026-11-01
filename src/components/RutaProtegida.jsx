import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Cargando from './Cargando'

// Muestra la página solo con sesión iniciada; si no, manda a /ingresar y
// recuerda a dónde quería ir el usuario.
function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="contenido-pagina">
        <Cargando />
      </div>
    )
  }
  if (!usuario) {
    return <Navigate to="/ingresar" replace state={{ desde: location.pathname + location.search }} />
  }
  return children
}

export default RutaProtegida
