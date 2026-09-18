import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import logo from '../assets/logo.jpg'
import './Header.css'

// Header fijo con logo, navegación principal y una búsqueda rápida.
// La búsqueda rápida simplemente te lleva a /recetas con el término ya aplicado.
function Header() {
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [texto, setTexto] = useState('')
  const navigate = useNavigate()

  function manejarBusqueda(evento) {
    evento.preventDefault()
    navigate(`/recetas?q=${encodeURIComponent(texto.trim())}`)
    setTexto('')
    setBusquedaAbierta(false)
  }

  return (
    <header className="header">
      <div className="contenedor header-interior">
        <NavLink to="/" className="header-logo">
          <img src={logo} alt="Alexandra's Kitchen" className="header-logo-imagen" />
        </NavLink>

        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'activo' : '')}>
            Inicio
          </NavLink>
          <NavLink to="/recetas" className={({ isActive }) => (isActive ? 'activo' : '')}>
            Recetas
          </NavLink>
          <NavLink to="/menu-semanal" className={({ isActive }) => (isActive ? 'activo' : '')}>
            Menú Semanal
          </NavLink>
          <NavLink to="/favoritos" className={({ isActive }) => (isActive ? 'activo' : '')}>
            Favoritos
          </NavLink>
        </nav>

        <div className="header-busqueda">
          {busquedaAbierta && (
            <form onSubmit={manejarBusqueda} className="header-busqueda-form">
              <input
                type="text"
                className="campo-formulario"
                placeholder="Buscar receta..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoFocus
              />
            </form>
          )}
          <button
            type="button"
            className="header-busqueda-boton"
            onClick={() => setBusquedaAbierta((abierto) => !abierto)}
            aria-label="Buscar receta"
          >
            <Search size={18} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
