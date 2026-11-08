import { NavLink } from 'react-router-dom'
import { BookOpen, CalendarDays, Heart, House, Users } from 'lucide-react'
import './BarraInferior.css'

const PESTANAS = [
  { ruta: '/', etiqueta: 'Inicio', icono: House, exacta: true },
  { ruta: '/recetas', etiqueta: 'Recetas', icono: BookOpen, exacta: true },
  { ruta: '/menu-semanal', etiqueta: 'Menú', icono: CalendarDays },
  { ruta: '/favoritos', etiqueta: 'Favoritos', icono: Heart },
  { ruta: '/familia', etiqueta: 'Familia', icono: Users },
]

// Con sesión, en móvil y tableta la app se navega con el pulgar: cinco
// pestañas fijas abajo, como una app instalada. En escritorio manda el header.
function BarraInferior() {
  return (
    <nav className="barra-inferior" aria-label="Secciones">
      <ul>
        {PESTANAS.map(({ ruta, etiqueta, icono: Icono, exacta }) => (
          <li key={ruta}>
            <NavLink to={ruta} end={exacta} className="barra-inferior-pestana">
              <span className="barra-inferior-icono">
                <Icono size={22} aria-hidden="true" />
              </span>
              {etiqueta}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BarraInferior
