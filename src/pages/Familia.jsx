import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Crown, LogOut, RefreshCw, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { mensajeError, supabase, urlRaizApp } from '../lib/supabase'
import Avatar from '../components/Avatar'
import Cargando from '../components/Cargando'
import './Familia.css'

// "Mi familia": crear una familia, unirse con un código o, si ya pertenece a
// una, ver integrantes, compartir la invitación y editar el perfil.
function Familia() {
  const { familia } = useAuth()

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <h1>Mi familia</h1>
        </div>
        {familia ? <PanelFamilia /> : <SinFamilia />}
        <MiPerfil />
      </div>
    </div>
  )
}

function SinFamilia() {
  const { crearFamilia, unirseAFamilia } = useAuth()
  const [parametros] = useSearchParams()
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState(parametros.get('codigo') || '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function ejecutar(accion) {
    setEnviando(true)
    setError('')
    try {
      await accion()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <p className="familia-intro">
        En una familia, todos los integrantes comparten el menú de la semana, las recetas que agreguen y
        los comentarios. Crea la tuya e invita a los demás con el código, o únete con el código que te
        compartieron.
      </p>
      {error && <p className="mensaje-error familia-error">{error}</p>}
      <div className="familia-opciones">
        <form
          className="tarjeta familia-opcion"
          onSubmit={(e) => {
            e.preventDefault()
            ejecutar(() => crearFamilia(nombre))
          }}
        >
          <Users size={30} className="familia-opcion-icono" aria-hidden="true" />
          <h2>Crear una familia</h2>
          <p>Quedarás como administrador y podrás invitar a los demás.</p>
          <input
            type="text"
            className="campo-formulario"
            placeholder="Ej. Familia Cardona"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            required
            aria-label="Nombre de la familia"
          />
          <button type="submit" className="boton boton-primario" disabled={enviando}>
            Crear familia
          </button>
        </form>

        <form
          className="tarjeta familia-opcion"
          onSubmit={(e) => {
            e.preventDefault()
            ejecutar(() => unirseAFamilia(codigo))
          }}
        >
          <UserPlus size={30} className="familia-opcion-icono" aria-hidden="true" />
          <h2>Unirme con un código</h2>
          <p>Pídele el código de 6 letras a alguien de tu familia.</p>
          <input
            type="text"
            className="campo-formulario familia-codigo-campo"
            placeholder="ABC123"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            maxLength={6}
            required
            aria-label="Código de invitación"
          />
          <button type="submit" className="boton boton-secundario" disabled={enviando}>
            Unirme
          </button>
        </form>
      </div>
    </>
  )
}

function PanelFamilia() {
  const { usuario, familia, regenerarCodigo, salirDeFamilia, renombrarFamilia } = useAuth()
  const [miembros, setMiembros] = useState(null)
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState(familia.nombre)
  const esAdmin = familia.rol === 'admin'

  const cargarMiembros = useCallback(async () => {
    const { data } = await supabase
      .from('familia_miembros')
      .select('user_id, rol, unido_en, perfil:perfiles(nombre, avatar_url)')
      .eq('familia_id', familia.id)
      .order('unido_en')
    setMiembros(data ?? [])
  }, [familia.id])

  useEffect(() => {
    cargarMiembros()
  }, [cargarMiembros])

  const enlaceInvitacion = `${urlRaizApp()}familia?codigo=${familia.codigo_invitacion}`

  async function copiar(texto, mensaje) {
    try {
      await navigator.clipboard.writeText(texto)
      setAviso(mensaje)
    } catch {
      setAviso(`Copia esto: ${texto}`)
    }
  }

  async function ejecutar(accion) {
    setError('')
    setAviso('')
    try {
      await accion()
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  function confirmarSalida() {
    const soloYo = miembros && miembros.length === 1
    const mensaje = soloYo
      ? 'Eres el único integrante: al salir se borrarán la familia, sus menús, recetas y comentarios. ¿Continuar?'
      : `¿Seguro que quieres salir de ${familia.nombre}?`
    if (window.confirm(mensaje)) ejecutar(salirDeFamilia)
  }

  return (
    <div className="familia-panel">
      <div className="tarjeta familia-cabecera">
        {editandoNombre ? (
          <form
            className="familia-renombrar"
            onSubmit={(e) => {
              e.preventDefault()
              ejecutar(async () => {
                await renombrarFamilia(nuevoNombre)
                setEditandoNombre(false)
              })
            }}
          >
            <input
              className="campo-formulario"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              maxLength={80}
              required
              aria-label="Nombre de la familia"
            />
            <button type="submit" className="boton boton-secundario">
              Guardar
            </button>
            <button type="button" className="boton boton-contorno" onClick={() => setEditandoNombre(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <div className="familia-nombre">
            <h2>{familia.nombre}</h2>
            {esAdmin && (
              <button type="button" className="familia-enlace" onClick={() => setEditandoNombre(true)}>
                Cambiar nombre
              </button>
            )}
          </div>
        )}

        <div className="familia-invitacion">
          <p className="familia-invitacion-titulo">Código de invitación</p>
          <div className="familia-codigo">
            <span>{familia.codigo_invitacion}</span>
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() => copiar(familia.codigo_invitacion, 'Código copiado.')}
            >
              <Copy size={16} aria-hidden="true" /> Copiar código
            </button>
            <button
              type="button"
              className="boton boton-primario"
              onClick={() => copiar(enlaceInvitacion, 'Enlace de invitación copiado. ¡Compártelo con tu familia!')}
            >
              <UserPlus size={16} aria-hidden="true" /> Copiar enlace de invitación
            </button>
            {esAdmin && (
              <button
                type="button"
                className="familia-enlace"
                onClick={() => {
                  if (window.confirm('El código actual dejará de funcionar. ¿Generar uno nuevo?')) {
                    ejecutar(regenerarCodigo)
                  }
                }}
              >
                <RefreshCw size={14} aria-hidden="true" /> Generar otro código
              </button>
            )}
          </div>
        </div>
        {aviso && <p className="mensaje-exito">{aviso}</p>}
        {error && <p className="mensaje-error">{error}</p>}
      </div>

      <div className="tarjeta">
        <h2 className="familia-subtitulo">Integrantes {miembros && `(${miembros.length})`}</h2>
        {!miembros ? (
          <Cargando texto="Cargando integrantes…" />
        ) : (
          <ul className="familia-miembros">
            {miembros.map((miembro) => (
              <li key={miembro.user_id}>
                <Avatar nombre={miembro.perfil?.nombre} url={miembro.perfil?.avatar_url} tamano={44} />
                <div>
                  <strong>
                    {miembro.perfil?.nombre || 'Integrante'}
                    {miembro.user_id === usuario.id && ' (tú)'}
                  </strong>
                  <span>Se unió el {new Date(miembro.unido_en).toLocaleDateString('es-CO')}</span>
                </div>
                {miembro.rol === 'admin' && (
                  <span className="etiqueta etiqueta-categoria familia-rol">
                    <Crown size={12} aria-hidden="true" /> Admin
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="boton boton-peligro familia-salir" onClick={confirmarSalida}>
          <LogOut size={16} aria-hidden="true" /> Salir de la familia
        </button>
      </div>
    </div>
  )
}

function MiPerfil() {
  const { usuario, perfil, actualizarNombre, cerrarSesion } = useAuth()
  const [nombre, setNombre] = useState(perfil?.nombre || '')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function guardar(evento) {
    evento.preventDefault()
    setMensaje('')
    setError('')
    try {
      await actualizarNombre(nombre)
      setMensaje('Nombre actualizado.')
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  return (
    <div className="tarjeta familia-perfil">
      <h2 className="familia-subtitulo">Mi perfil</h2>
      <div className="familia-perfil-fila">
        <Avatar nombre={perfil?.nombre} url={perfil?.avatar_url} tamano={56} />
        <div>
          <strong>{perfil?.nombre}</strong>
          <span>{usuario?.email}</span>
        </div>
      </div>
      <form className="familia-perfil-form" onSubmit={guardar}>
        <label htmlFor="perfil-nombre">Cómo te ve tu familia</label>
        <div>
          <input
            id="perfil-nombre"
            className="campo-formulario"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            required
          />
          <button type="submit" className="boton boton-secundario" disabled={!nombre.trim() || nombre === perfil?.nombre}>
            Guardar
          </button>
        </div>
      </form>
      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}
      <button type="button" className="boton boton-contorno familia-cerrar-sesion" onClick={cerrarSesion}>
        <LogOut size={16} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  )
}

export default Familia
