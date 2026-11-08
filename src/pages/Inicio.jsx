import { useAuth } from '../context/AuthContext'
import Cargando from '../components/Cargando'
import PanelInicio from './PanelInicio'
import Portada from './Portada'

// Con sesión, el inicio es el panel de la familia; sin sesión, la portada.
function Inicio() {
  const { usuario, cargando } = useAuth()
  if (cargando) {
    return (
      <div className="contenido-pagina">
        <Cargando texto="Cargando…" />
      </div>
    )
  }
  return usuario ? <PanelInicio /> : <Portada />
}

export default Inicio
