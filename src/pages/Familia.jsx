import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Copy, Crown, LogOut, Pencil, RefreshCw, Share2, UserPlus, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { mensajeError, supabase, urlRaizApp } from '../lib/supabase'
import { useMenuSemanal } from '../hooks/useMenuSemanal'
import { lunesDe } from '../utils/fechas'
import Avatar from '../components/Avatar'
import Cargando from '../components/Cargando'
import './Familia.css'

// "Mi familia": con familia, quiénes son, cómo invitar a los demás y tu perfil;
// sin familia, crear una o unirse con el código que te compartieron.
function Familia() {
  const { familia } = useAuth()

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion familia">
        {familia ? <PanelFamilia /> : <SinFamilia />}
      </div>
    </div>
  )
}

function SinFamilia() {
  const { crearFamilia, unirseAFamilia } = useAuth()
  const [parametros] = useSearchParams()
  const codigoInvitacion = parametros.get('codigo') || ''
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState(codigoInvitacion)
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

  const unirse = (
    <form
      key="unirse"
      className="tarjeta familia-opcion"
      onSubmit={(e) => {
        e.preventDefault()
        ejecutar(() => unirseAFamilia(codigo))
      }}
    >
      <span className="mosaico" aria-hidden="true">
        <UserPlus />
      </span>
      <h2>{codigoInvitacion ? 'Te invitaron a una familia' : 'Unirme con un código'}</h2>
      <p>
        {codigoInvitacion
          ? 'El código ya está escrito. Solo falta que confirmes.'
          : 'Pídele el código de 6 letras a alguien de tu familia.'}
      </p>
      <label htmlFor="familia-codigo" className="solo-lectores">
        Código de invitación
      </label>
      <input
        id="familia-codigo"
        type="text"
        className="campo-formulario familia-codigo-campo"
        placeholder="ABC123"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        maxLength={6}
        autoComplete="off"
        required
      />
      <button
        type="submit"
        className={`boton ${codigoInvitacion ? 'boton-primario' : 'boton-secundario'}`}
        disabled={enviando}
      >
        Unirme a la familia
      </button>
    </form>
  )

  const crear = (
    <form
      key="crear"
      className="tarjeta familia-opcion"
      onSubmit={(e) => {
        e.preventDefault()
        ejecutar(() => crearFamilia(nombre))
      }}
    >
      <span className="mosaico" aria-hidden="true">
        <Users />
      </span>
      <h2>Crear una familia</h2>
      <p>Quedarás como administrador y podrás invitar a los demás.</p>
      <label htmlFor="familia-nueva" className="solo-lectores">
        Nombre de la familia
      </label>
      <input
        id="familia-nueva"
        type="text"
        className="campo-formulario"
        placeholder="Ej. Familia Cardona"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={80}
        required
      />
      <button
        type="submit"
        className={`boton ${codigoInvitacion ? 'boton-secundario' : 'boton-primario'}`}
        disabled={enviando}
      >
        Crear familia
      </button>
    </form>
  )

  return (
    <>
      <header className="familia-cabecera">
        <h1>Mi familia</h1>
        <p className="familia-intro">
          En familia comparten el menú de la semana, la lista de mercado, las recetas que agreguen y los
          comentarios.
        </p>
      </header>
      {error && <p className="mensaje-error familia-error">{error}</p>}
      {/* Si llegó con un enlace de invitación, unirse va primero. */}
      <div className="familia-opciones">{codigoInvitacion ? [unirse, crear] : [crear, unirse]}</div>
      <MiPerfil />
    </>
  )
}

function PanelFamilia() {
  const { familia } = useAuth()
  const [miembros, setMiembros] = useState(null)

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

  return (
    <>
      <NombreFamilia cantidad={miembros?.length} />
      <div className="familia-columnas">
        <div className="familia-principal">
          <Invitacion />
          <Integrantes miembros={miembros} />
        </div>
        <div className="familia-lateral">
          <MiPerfil />
          <SalirDeFamilia soloYo={miembros?.length === 1} />
        </div>
      </div>
    </>
  )
}

function NombreFamilia({ cantidad }) {
  const { familia, renombrarFamilia } = useAuth()
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(familia.nombre)
  const [error, setError] = useState('')
  const esAdmin = familia.rol === 'admin'

  async function guardar(evento) {
    evento.preventDefault()
    setError('')
    try {
      await renombrarFamilia(nombre)
      setEditando(false)
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  if (editando) {
    return (
      <header className="familia-cabecera">
        <form className="familia-renombrar" onSubmit={guardar}>
          <label htmlFor="familia-nombre">Nombre de la familia</label>
          <div>
            <input
              id="familia-nombre"
              className="campo-formulario"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={80}
              required
              autoFocus
            />
            <button type="submit" className="boton boton-primario" disabled={!nombre.trim()}>
              Guardar nombre
            </button>
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() => {
                setNombre(familia.nombre)
                setEditando(false)
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
        {error && <p className="mensaje-error">{error}</p>}
      </header>
    )
  }

  return (
    <header className="familia-cabecera">
      <div className="familia-titulo">
        <h1>{familia.nombre}</h1>
        {esAdmin && (
          <button
            type="button"
            className="familia-icono"
            onClick={() => setEditando(true)}
            aria-label="Cambiar el nombre de la familia"
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {cantidad > 0 && (
        <p className="familia-intro">
          {cantidad === 1 ? 'Por ahora no hay nadie más. Invita a los demás.' : `${cantidad} integrantes`}
        </p>
      )}
    </header>
  )
}

// El código va en una tarjeta tipo boleto: se comparte con el menú nativo del
// teléfono (WhatsApp, mensajes…) o se copia.
function Invitacion() {
  const { familia, regenerarCodigo } = useAuth()
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const esAdmin = familia.rol === 'admin'
  const enlace = `${urlRaizApp()}familia?codigo=${familia.codigo_invitacion}`
  const mensaje = `Únete a ${familia.nombre} en Pensil.Food para planear el menú de la semana juntos. Entra aquí: ${enlace} (código ${familia.codigo_invitacion})`

  async function copiar(texto, confirmacion) {
    setError('')
    try {
      await navigator.clipboard.writeText(texto)
      setAviso(confirmacion)
    } catch {
      setAviso(`Copia esto: ${texto}`)
    }
  }

  async function compartir() {
    setAviso('')
    if (navigator.share) {
      try {
        await navigator.share({ title: `Únete a ${familia.nombre}`, text: mensaje })
      } catch {
        // La persona cerró el menú de compartir: no es un error.
      }
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener')
  }

  async function nuevoCodigo() {
    if (!window.confirm('El código actual dejará de funcionar. ¿Generar uno nuevo?')) return
    setAviso('')
    setError('')
    try {
      await regenerarCodigo()
      setAviso('Listo: ese es el código nuevo.')
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  return (
    <section className="familia-invitacion" aria-labelledby="familia-invitacion-titulo">
      <div className="familia-boleto">
        <div>
          <h2 id="familia-invitacion-titulo">Invita a tu familia</h2>
          <p>Con este código entran a {familia.nombre} y ven el mismo menú.</p>
        </div>
        <p className="familia-boleto-codigo" aria-label={`Código ${familia.codigo_invitacion.split('').join(' ')}`}>
          {familia.codigo_invitacion}
        </p>
      </div>
      <div className="familia-invitacion-acciones">
        <button type="button" className="boton boton-primario" onClick={compartir}>
          <Share2 aria-hidden="true" /> Compartir invitación
        </button>
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() => copiar(familia.codigo_invitacion, 'Código copiado.')}
        >
          <Copy aria-hidden="true" /> Copiar código
        </button>
      </div>
      {esAdmin && (
        <button type="button" className="familia-enlace" onClick={nuevoCodigo}>
          <RefreshCw size={16} aria-hidden="true" /> Generar otro código
        </button>
      )}
      <div aria-live="polite">
        {aviso && (
          <p className="mensaje-exito">
            <Check size={16} aria-hidden="true" /> {aviso}
          </p>
        )}
        {error && <p className="mensaje-error">{error}</p>}
      </div>
    </section>
  )
}

// Quiénes son y cuántas comidas eligió cada uno esta semana.
function Integrantes({ miembros }) {
  const { usuario } = useAuth()
  const lunes = useMemo(() => lunesDe(new Date()), [])
  const { menu, cargando } = useMenuSemanal(lunes)

  const comidasPorPersona = useMemo(() => {
    const conteo = {}
    menu.forEach((dia) =>
      Object.values(dia).forEach((item) => {
        if (item?.elegido_por) conteo[item.elegido_por] = (conteo[item.elegido_por] || 0) + 1
      })
    )
    return conteo
  }, [menu])

  return (
    <section className="familia-seccion" aria-labelledby="familia-integrantes-titulo">
      <h2 id="familia-integrantes-titulo">Integrantes</h2>
      {!miembros ? (
        <Cargando texto="Cargando integrantes…" />
      ) : (
        <ul className="familia-miembros">
          {miembros.map((miembro) => {
            const esYo = miembro.user_id === usuario.id
            const comidas = comidasPorPersona[miembro.user_id] || 0
            return (
              <li key={miembro.user_id}>
                <Avatar nombre={miembro.perfil?.nombre} url={miembro.perfil?.avatar_url} tamano={48} />
                <div className="familia-miembro-texto">
                  <strong>
                    {miembro.perfil?.nombre || 'Integrante'}
                    {esYo && <span className="familia-tu"> (tú)</span>}
                  </strong>
                  <span>
                    {cargando
                      ? `Desde el ${new Date(miembro.unido_en).toLocaleDateString('es-CO')}`
                      : comidas === 0
                        ? 'No ha elegido comidas esta semana'
                        : `Eligió ${comidas} ${comidas === 1 ? 'comida' : 'comidas'} esta semana`}
                  </span>
                </div>
                {miembro.rol === 'admin' && (
                  <span className="etiqueta etiqueta-categoria familia-rol">
                    <Crown aria-hidden="true" /> Admin
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function MiPerfil() {
  const { usuario, perfil, actualizarNombre, cerrarSesion } = useAuth()
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(perfil?.nombre || '')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function guardar(evento) {
    evento.preventDefault()
    setMensaje('')
    setError('')
    try {
      await actualizarNombre(nombre)
      setEditando(false)
      setMensaje('Nombre actualizado.')
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  return (
    <section className="familia-seccion familia-perfil" aria-labelledby="familia-perfil-titulo">
      <h2 id="familia-perfil-titulo">Tu perfil</h2>
      <div className="familia-perfil-tarjeta">
        <div className="familia-perfil-fila">
          <Avatar nombre={perfil?.nombre} url={perfil?.avatar_url} tamano={56} />
          <div className="familia-miembro-texto">
            <strong>{perfil?.nombre}</strong>
            <span>{usuario?.email}</span>
          </div>
          {!editando && (
            <button
              type="button"
              className="familia-icono"
              onClick={() => {
                setNombre(perfil?.nombre || '')
                setMensaje('')
                setEditando(true)
              }}
              aria-label="Cambiar tu nombre"
            >
              <Pencil size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {editando && (
          <form className="familia-perfil-form" onSubmit={guardar}>
            <label htmlFor="perfil-nombre">Cómo te ve tu familia</label>
            <input
              id="perfil-nombre"
              className="campo-formulario"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={60}
              required
              autoFocus
            />
            <div>
              <button
                type="submit"
                className="boton boton-primario"
                disabled={!nombre.trim() || nombre === perfil?.nombre}
              >
                Guardar nombre
              </button>
              <button type="button" className="boton boton-contorno" onClick={() => setEditando(false)}>
                <X aria-hidden="true" /> Cancelar
              </button>
            </div>
          </form>
        )}
        <div aria-live="polite">
          {mensaje && <p className="mensaje-exito">{mensaje}</p>}
          {error && <p className="mensaje-error">{error}</p>}
        </div>

        <button type="button" className="boton boton-contorno familia-cerrar-sesion" onClick={cerrarSesion}>
          <LogOut aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </section>
  )
}

function SalirDeFamilia({ soloYo }) {
  const { familia, salirDeFamilia } = useAuth()
  const [error, setError] = useState('')

  async function salir() {
    const mensaje = soloYo
      ? 'Eres el único integrante: al salir se borrarán la familia, sus menús, recetas y comentarios. ¿Continuar?'
      : `¿Seguro que quieres salir de ${familia.nombre}?`
    if (!window.confirm(mensaje)) return
    setError('')
    try {
      await salirDeFamilia()
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  return (
    <div className="familia-salir">
      <button type="button" className="boton boton-peligro" onClick={salir}>
        <LogOut aria-hidden="true" /> Salir de la familia
      </button>
      <p>
        {soloYo
          ? 'Eres el único integrante: si sales, se borra la familia con su menú y sus recetas.'
          : 'Dejarás de ver el menú, las recetas y los comentarios de la familia.'}
      </p>
      {error && <p className="mensaje-error">{error}</p>}
    </div>
  )
}

export default Familia
