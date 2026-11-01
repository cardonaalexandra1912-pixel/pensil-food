import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import './AvisoSinFamilia.css'

// Se muestra donde hace falta pertenecer a una familia (menú, comentarios...).
function AvisoSinFamilia({ mensaje }) {
  return (
    <div className="aviso-sin-familia">
      <span className="mosaico" aria-hidden="true">
        <Users />
      </span>
      <div>
        <p className="aviso-sin-familia-titulo">Todavía no perteneces a una familia</p>
        <p>{mensaje}</p>
      </div>
      <Link to="/familia" className="boton boton-primario">
        Crear o unirme a una familia <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  )
}

export default AvisoSinFamilia
