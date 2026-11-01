import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../lib/supabase'
import logo from '../assets/logo.jpg'
import './Ingresar.css'

function LogoGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

// Pantalla de ingreso: Google o correo y contraseña (ingresar / crear cuenta).
function Ingresar() {
  const { usuario, iniciarConGoogle, iniciarConCorreo, registrarse } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.desde || '/'

  const [modo, setModo] = useState('ingresar') // 'ingresar' | 'registro'
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  // Con sesión iniciada no tiene sentido estar aquí.
  useEffect(() => {
    if (usuario) navigate(destino, { replace: true })
  }, [usuario, destino, navigate])

  async function conGoogle() {
    setError('')
    setEnviando(true)
    try {
      await iniciarConGoogle(destino)
    } catch (e) {
      setError(mensajeError(e))
      setEnviando(false)
    }
  }

  async function conCorreo(evento) {
    evento.preventDefault()
    setError('')
    setAviso('')
    setEnviando(true)
    try {
      if (modo === 'ingresar') {
        await iniciarConCorreo(correo, contrasena)
      } else {
        const conSesion = await registrarse(nombre, correo, contrasena)
        if (!conSesion) {
          setAviso('¡Listo! Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego vuelve a ingresar.')
          setModo('ingresar')
        }
      }
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="contenido-pagina ingresar-pagina">
      <div className="contenedor seccion">
        <div className="tarjeta ingresar-tarjeta">
          <img src={logo} alt="" className="ingresar-logo" />
          <h1>{modo === 'ingresar' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
          <p className="ingresar-subtitulo">
            Guarda tus favoritas, planea el menú de la semana con tu familia y comenten juntos las
            recetas.
          </p>

          <button type="button" className="boton ingresar-google" onClick={conGoogle} disabled={enviando}>
            <LogoGoogle />
            Continuar con Google
          </button>

          <div className="ingresar-separador">
            <span>o con tu correo</span>
          </div>

          <form className="ingresar-form" onSubmit={conCorreo}>
            {modo === 'registro' && (
              <label>
                Tu nombre
                <input
                  type="text"
                  className="campo-formulario"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              Correo
              <input
                type="email"
                className="campo-formulario"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                className="campo-formulario"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </label>

            {error && <p className="mensaje-error">{error}</p>}
            {aviso && <p className="mensaje-exito">{aviso}</p>}

            <button type="submit" className="boton boton-primario" disabled={enviando}>
              {enviando ? 'Un momento…' : modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="ingresar-cambiar">
            {modo === 'ingresar' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setModo(modo === 'ingresar' ? 'registro' : 'ingresar')
                setError('')
              }}
            >
              {modo === 'ingresar' ? 'Créala aquí' : 'Ingresa'}
            </button>
          </p>

          <Link to="/" className="ingresar-volver">
            ← Seguir viendo recetas sin cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Ingresar
