import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Search, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.jpg'
import Avatar from './Avatar'
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

        <div className="header-acciones">
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
        <MenuUsuario />
        </div>
      </div>
    </header>
  )
}

// Avatar con menú desplegable (con sesión) o botón "Ingresar" (sin sesión).
function MenuUsuario() {
  const { usuario, perfil, familia, cargando, cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef(null)
  const location = useLocation()

  // Se cierra al cambiar de página o al hacer clic afuera.
  useEffect(() => setAbierto(false), [location.pathname])
  useEffect(() => {
    if (!abierto) return
    function alHacerClic(evento) {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', alHacerClic)
    return () => document.removeEventListener('mousedown', alHacerClic)
  }, [abierto])

  if (cargando) return <span className="header-usuario-espacio" aria-hidden="true" />

  if (!usuario) {
    return (
      <Link to="/ingresar" state={{ desde: location.pathname + location.search }} className="boton boton-primario header-ingresar">
        Ingresar
      </Link>
    )
  }

  const nombre = perfil?.nombre || usuario.email

  return (
    <div className="header-usuario" ref={contenedorRef}>
      <button
        type="button"
        className="header-usuario-boton"
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Menú de ${nombre}`}
      >
        <Avatar nombre={nombre} url={perfil?.avatar_url} tamano={36} />
      </button>
      {abierto && (
        <div className="header-usuario-menu" role="menu">
          <div className="header-usuario-datos">
            <strong>{nombre}</strong>
            <span>{familia ? familia.nombre : 'Sin familia todavía'}</span>
          </div>
          <Link to="/familia" role="menuitem">
            <Users size={16} aria-hidden="true" /> Mi familia
          </Link>
          <Link to="/recetas/nueva" role="menuitem">
            <Plus size={16} aria-hidden="true" /> Nueva receta
          </Link>
          <button type="button" role="menuitem" onClick={cerrarSesion}>
            <LogOut size={16} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default Header
