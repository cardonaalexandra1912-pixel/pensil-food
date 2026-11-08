import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Heart, MailCheck, MessageCircle, ShoppingBasket } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GOOGLE_HABILITADO, mensajeError } from '../lib/supabase'
import CampoContrasena from '../components/CampoContrasena'
import logo from '../assets/logo.jpg'
import './Ingresar.css'

const FOTO = `${import.meta.env.BASE_URL}imagenes/recetas/11.jpg?v=20261031`

const BENEFICIOS = [
  { icono: CalendarDays, texto: 'Planean el menú de la semana entre todos, en vivo.' },
  { icono: ShoppingBasket, texto: 'La lista de mercado se arma sola.' },
  { icono: Heart, texto: 'Tus favoritas, a un toque.' },
  { icono: MessageCircle, texto: 'Comentan las recetas en familia.' },
]

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

// Ingreso: entrar, crear cuenta, recuperar la contraseña o «revisa tu correo».
// Si se llega con un enlace de invitación a una familia, abre en «Crear cuenta».
function Ingresar() {
  const { usuario, iniciarConGoogle, iniciarConCorreo, registrarse, enviarRecuperacion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.desde || '/'
  const vieneDeInvitacion = destino.startsWith('/familia?codigo=')

  const [modo, setModo] = useState(
    vieneDeInvitacion || location.state?.modo === 'registro' ? 'registro' : 'ingresar'
  )
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [correoEnviado, setCorreoEnviado] = useState(null) // { tipo: 'confirmar' | 'recuperar', correo }

  // Con sesión iniciada no tiene sentido estar aquí.
  useEffect(() => {
    if (usuario) navigate(destino, { replace: true })
  }, [usuario, destino, navigate])

  function cambiarModo(nuevo) {
    setModo(nuevo)
    setError('')
  }

  async function ejecutar(accion) {
    setError('')
    setEnviando(true)
    try {
      await accion()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  function enviar(evento) {
    evento.preventDefault()
    ejecutar(async () => {
      if (modo === 'ingresar') {
        await iniciarConCorreo(correo, contrasena)
      } else if (modo === 'registro') {
        const conSesion = await registrarse(nombre, correo, contrasena)
        if (!conSesion) setCorreoEnviado({ tipo: 'confirmar', correo: correo.trim() })
      } else {
        await enviarRecuperacion(correo)
        setCorreoEnviado({ tipo: 'recuperar', correo: correo.trim() })
      }
    })
  }

  const titulos = {
    ingresar: 'Qué bueno verte de nuevo',
    registro: vieneDeInvitacion ? 'Te invitaron a una familia' : 'Crea tu cuenta',
    recuperar: 'Recupera tu contraseña',
  }
  const subtitulos = {
    ingresar: 'Entra para ver el menú de la semana y tus favoritas.',
    registro: vieneDeInvitacion
      ? 'Crea tu cuenta y quedas dentro de la familia que te invitó.'
      : 'Es gratis. Luego creas tu familia o te unes con un código.',
    recuperar: 'Escribe el correo de tu cuenta y te enviamos un enlace para poner una contraseña nueva.',
  }

  return (
    <div className="contenido-pagina ingresar-pagina">
      <div className="contenedor ingresar">
        <aside className="ingresar-marca">
          <img src={FOTO} alt="" />
          <div className="ingresar-marca-texto">
            <p className="ingresar-marca-titulo">La cocina de la casa, organizada.</p>
            <ul>
              {BENEFICIOS.map(({ icono: Icono, texto }) => (
                <li key={texto}>
                  <Icono size={18} aria-hidden="true" />
                  {texto}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="ingresar-panel">
          <span className="ingresar-logo">
            <img src={logo} alt="" />
          </span>

          {correoEnviado ? (
            <RevisaTuCorreo
              {...correoEnviado}
              alVolver={() => {
                setCorreoEnviado(null)
                cambiarModo('ingresar')
              }}
            />
          ) : (
            <>
              {modo !== 'recuperar' && (
                <div className="ingresar-modos" role="group" aria-label="Cuenta">
                  <button
                    type="button"
                    aria-pressed={modo === 'ingresar'}
                    onClick={() => cambiarModo('ingresar')}
                  >
                    Ingresar
                  </button>
                  <button
                    type="button"
                    aria-pressed={modo === 'registro'}
                    onClick={() => cambiarModo('registro')}
                  >
                    Crear cuenta
                  </button>
                </div>
              )}

              <h1>{titulos[modo]}</h1>
              <p className="ingresar-subtitulo">{subtitulos[modo]}</p>

              {GOOGLE_HABILITADO && modo !== 'recuperar' && (
                <>
                  <button
                    type="button"
                    className="boton ingresar-google"
                    onClick={() => ejecutar(() => iniciarConGoogle(destino))}
                    disabled={enviando}
                  >
                    <LogoGoogle />
                    Continuar con Google
                  </button>
                  <div className="ingresar-separador">
                    <span>o con tu correo</span>
                  </div>
                </>
              )}

              <form className="ingresar-form" onSubmit={enviar}>
                {modo === 'registro' && (
                  <div className="ingresar-campo">
                    <label htmlFor="ingresar-nombre">Tu nombre</label>
                    <input
                      id="ingresar-nombre"
                      type="text"
                      className="campo-formulario"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      autoComplete="given-name"
                      placeholder="Así te verá tu familia"
                      required
                    />
                  </div>
                )}
                <div className="ingresar-campo">
                  <label htmlFor="ingresar-correo">Correo</label>
                  <input
                    id="ingresar-correo"
                    type="email"
                    inputMode="email"
                    className="campo-formulario"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    autoComplete="email"
                    autoCapitalize="none"
                    required
                  />
                </div>
                {modo !== 'recuperar' && (
                  <CampoContrasena
                    id="ingresar-contrasena"
                    etiqueta="Contraseña"
                    valor={contrasena}
                    alCambiar={setContrasena}
                    autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'}
                    ayuda={modo === 'registro' ? 'Mínimo 6 caracteres.' : undefined}
                  />
                )}
                {modo === 'ingresar' && (
                  <button type="button" className="ingresar-enlace ingresar-olvide" onClick={() => cambiarModo('recuperar')}>
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                {error && (
                  <p className="mensaje-error" role="alert">
                    {error}
                  </p>
                )}

                <button type="submit" className="boton boton-primario" disabled={enviando}>
                  {enviando
                    ? 'Un momento…'
                    : { ingresar: 'Ingresar', registro: 'Crear cuenta', recuperar: 'Enviar enlace' }[modo]}
                </button>
              </form>

              {modo === 'recuperar' && (
                <button type="button" className="ingresar-enlace" onClick={() => cambiarModo('ingresar')}>
                  <ArrowLeft size={18} aria-hidden="true" /> Volver a ingresar
                </button>
              )}
            </>
          )}

          <Link to="/" className="ingresar-volver">
            Seguir viendo recetas sin cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}

function RevisaTuCorreo({ tipo, correo, alVolver }) {
  return (
    <div className="ingresar-revisa" role="status">
      <span className="mosaico" aria-hidden="true">
        <MailCheck />
      </span>
      <h1>Revisa tu correo</h1>
      <p>
        Te enviamos un enlace a <strong>{correo}</strong>.{' '}
        {tipo === 'confirmar'
          ? 'Ábrelo para confirmar tu cuenta y luego ingresa.'
          : 'Ábrelo en este mismo navegador para poner una contraseña nueva.'}
      </p>
      <p className="ingresar-ayuda">Si no llega en un par de minutos, busca en la carpeta de spam o promociones.</p>
      <button type="button" className="boton boton-secundario" onClick={alVolver}>
        Volver a ingresar
      </button>
    </div>
  )
}

export default Ingresar
