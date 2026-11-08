import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { mensajeError } from '../lib/supabase'
import Cargando from '../components/Cargando'
import CampoContrasena from '../components/CampoContrasena'
import EstadoVacio from '../components/EstadoVacio'
import logo from '../assets/logo.jpg'
import './Ingresar.css'

// Destino del enlace de «¿Olvidaste tu contraseña?». Supabase abre la sesión
// con el código del enlace; aquí solo se elige la contraseña nueva.
function NuevaContrasena() {
  const { usuario, cargando, cambiarContrasena } = useAuth()
  const navigate = useNavigate()
  const [contrasena, setContrasena] = useState('')
  const [repetida, setRepetida] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  if (cargando) {
    return (
      <div className="contenido-pagina">
        <Cargando texto="Abriendo el enlace…" />
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="contenido-pagina">
        <div className="contenedor seccion">
          <EstadoVacio
            icono={KeyRound}
            titulo="Este enlace ya no sirve"
            mensaje="Los enlaces para cambiar la contraseña se usan una sola vez y vencen pronto. Pide uno nuevo."
          >
            <Link to="/ingresar" className="boton boton-primario">
              Ir a ingresar
            </Link>
          </EstadoVacio>
        </div>
      </div>
    )
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError('')
    if (contrasena !== repetida) {
      setError('Las dos contraseñas no coinciden.')
      return
    }
    setEnviando(true)
    try {
      await cambiarContrasena(contrasena)
      navigate('/', { replace: true })
    } catch (e) {
      setError(mensajeError(e))
      setEnviando(false)
    }
  }

  return (
    <div className="contenido-pagina ingresar-pagina">
      <div className="contenedor ingresar ingresar-solo">
        <div className="ingresar-panel">
          <span className="ingresar-logo">
            <img src={logo} alt="" />
          </span>
          <h1>Pon tu contraseña nueva</h1>
          <p className="ingresar-subtitulo">Es para la cuenta {usuario.email}.</p>
          <form className="ingresar-form" onSubmit={guardar}>
            <CampoContrasena
              id="nueva-contrasena"
              etiqueta="Contraseña nueva"
              valor={contrasena}
              alCambiar={setContrasena}
              autoComplete="new-password"
              ayuda="Mínimo 6 caracteres."
            />
            <CampoContrasena
              id="nueva-contrasena-repetida"
              etiqueta="Repítela"
              valor={repetida}
              alCambiar={setRepetida}
              autoComplete="new-password"
            />
            {error && (
              <p className="mensaje-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="boton boton-primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NuevaContrasena
