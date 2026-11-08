import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Plus, Search, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import Logotipo from './Logotipo'
import './Header.css'

const ENLACES = [
  { ruta: '/', etiqueta: 'Inicio', exacta: true },
  { ruta: '/recetas', etiqueta: 'Recetas', exacta: true },
  { ruta: '/menu-semanal', etiqueta: 'Menú semanal' },
  { ruta: '/favoritos', etiqueta: 'Favoritos' },
]
const ENLACE_FAMILIA = { ruta: '/familia', etiqueta: 'Mi familia' }

// Encabezado fijo (72 px) al estilo de Pensil.Devs: logotipo, navegación en
// píldoras, búsqueda rápida y la cuenta. En móvil la navegación se despliega.
function Header() {
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario } = useAuth()
  const enlaces = usuario ? [...ENLACES, ENLACE_FAMILIA] : ENLACES

  // Al cambiar de página se cierran la búsqueda y el menú móvil.
  useEffect(() => {
    setMenuMovilAbierto(false)
    setBusquedaAbierta(false)
  }, [location.pathname])

  function manejarBusqueda(evento) {
    evento.preventDefault()
    navigate(`/recetas?q=${encodeURIComponent(texto.trim())}`)
    setTexto('')
    setBusquedaAbierta(false)
  }

  const claseEnlace = ({ isActive }) => `header-enlace ${isActive ? 'activo' : ''}`

  return (
    <header className="header">
      <nav className="contenedor header-interior" aria-label="Principal">
        <Logotipo />

        <ul className="header-nav">
          {enlaces.map((enlace) => (
            <li key={enlace.ruta}>
              <NavLink to={enlace.ruta} end={enlace.exacta} className={claseEnlace}>
                {enlace.etiqueta}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="header-acciones">
          {busquedaAbierta && (
            <form onSubmit={manejarBusqueda} className="header-busqueda-form" role="search">
              <label htmlFor="busqueda-rapida" className="solo-lectores">
                Buscar receta
              </label>
              <input
                id="busqueda-rapida"
                type="search"
                className="campo-formulario"
                placeholder="Buscar receta"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoFocus
              />
            </form>
          )}
          <button
            type="button"
            className="header-icono"
            onClick={() => setBusquedaAbierta((abierto) => !abierto)}
            aria-expanded={busquedaAbierta}
            aria-label={busquedaAbierta ? 'Cerrar búsqueda' : 'Buscar receta'}
          >
            {busquedaAbierta ? <X size={20} aria-hidden="true" /> : <Search size={20} aria-hidden="true" />}
          </button>
          <MenuUsuario />
          {/* Con sesión, en móvil las secciones están en la barra de abajo. */}
          {!usuario && (
            <button
              type="button"
              className="header-icono header-menu-movil-boton"
              aria-controls="menu-movil"
              aria-expanded={menuMovilAbierto}
              aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
            >
              {menuMovilAbierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          )}
        </div>
      </nav>

      <div id="menu-movil" className="header-menu-movil" hidden={!menuMovilAbierto || Boolean(usuario)}>
        <ul className="contenedor">
          {ENLACES.map((enlace) => (
            <li key={enlace.ruta}>
              <NavLink to={enlace.ruta} end={enlace.exacta} className={claseEnlace}>
                {enlace.etiqueta}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

// Avatar con menú desplegable (con sesión) o botón «Ingresar» (sin sesión).
function MenuUsuario() {
  const { usuario, perfil, familia, cargando, cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef(null)
  const location = useLocation()

  // Se cierra al cambiar de página, al hacer clic afuera o con Escape.
  useEffect(() => setAbierto(false), [location.pathname])
  useEffect(() => {
    if (!abierto) return
    function alHacerClic(evento) {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false)
    }
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alHacerClic)
    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [abierto])

  if (cargando) return <span className="header-usuario-espacio" aria-hidden="true" />

  if (!usuario) {
    // En las páginas de ingreso el botón llevaría al mismo lugar.
    if (['/ingresar', '/nueva-contrasena'].includes(location.pathname)) return null
    return (
      <Link
        to="/ingresar"
        state={{ desde: location.pathname + location.search }}
        className="boton boton-primario boton-chico"
      >
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
        aria-label={`Tu cuenta: ${nombre}`}
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
            <Users size={18} aria-hidden="true" /> Mi familia
          </Link>
          <Link to="/recetas/nueva" role="menuitem">
            <Plus size={18} aria-hidden="true" /> Nueva receta
          </Link>
          <button type="button" role="menuitem" onClick={cerrarSesion}>
            <LogOut size={18} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default Header
