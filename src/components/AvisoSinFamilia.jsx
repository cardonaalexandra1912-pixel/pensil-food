import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import './AvisoSinFamilia.css'

// Se muestra donde hace falta pertenecer a una familia (menú, comentarios...).
function AvisoSinFamilia({ mensaje }) {
  return (
    <div className="aviso-sin-familia">
      <Users size={28} aria-hidden="true" />
      <div>
        <p className="aviso-sin-familia-titulo">Todavía no perteneces a una familia</p>
        <p>{mensaje}</p>
      </div>
      <Link to="/familia" className="boton boton-primario">
        Crear o unirme a una familia
      </Link>
    </div>
  )
}

export default AvisoSinFamilia
