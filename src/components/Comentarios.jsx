import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useComentarios } from '../hooks/useComentarios'
import { mensajeError } from '../lib/supabase'
import { tiempoRelativo } from '../utils/fechas'
import Avatar from './Avatar'
import AvisoSinFamilia from './AvisoSinFamilia'
import './Comentarios.css'

// Conversación de la familia sobre una receta (tipo="receta") o sobre el
// menú de una semana (tipo="menu").
function Comentarios({ tipo, objetivoId, titulo, descripcion }) {
  const { usuario, familia } = useAuth()
  const location = useLocation()
  const { comentarios, cargando, habilitado, agregar, borrar } = useComentarios(tipo, objetivoId)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function enviar(evento) {
    evento.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    setError('')
    try {
      await agregar(texto)
      setTexto('')
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="comentarios">
      <div className="comentarios-encabezado">
        <h2>
          <MessageCircle size={22} aria-hidden="true" /> {titulo}
        </h2>
        {familia && <span className="comentarios-familia">Solo lo ve {familia.nombre}</span>}
      </div>
      {descripcion && <p className="comentarios-descripcion">{descripcion}</p>}

      {!usuario ? (
        <p className="comentarios-aviso">
          <Link to="/ingresar" state={{ desde: location.pathname }} className="comentarios-enlace">
            Ingresa
          </Link>{' '}
          para leer y dejar comentarios con tu familia.
        </p>
      ) : !familia ? (
        <AvisoSinFamilia mensaje="Los comentarios se comparten con los integrantes de tu familia." />
      ) : (
        habilitado && (
          <>
            {cargando && comentarios.length === 0 ? (
              <p className="comentarios-aviso">Cargando comentarios…</p>
            ) : comentarios.length === 0 ? (
              <p className="comentarios-aviso">Nadie ha comentado todavía. ¡Sé el primero!</p>
            ) : (
              <ul className="comentarios-lista">
                {comentarios.map((comentario) => {
                  const nombre = comentario.autor?.nombre || 'Ex integrante'
                  const esMio = comentario.autor_id === usuario.id
                  return (
                    <li key={comentario.id} className={`comentario ${esMio ? 'es-mio' : ''}`}>
                      <Avatar nombre={nombre} url={comentario.autor?.avatar_url} tamano={36} />
                      <div className="comentario-cuerpo">
                        <div className="comentario-meta">
                          <strong>{esMio ? 'Tú' : nombre}</strong>
                          <span>{tiempoRelativo(comentario.creado_en)}</span>
                          {esMio && (
                            <button
                              type="button"
                              className="comentario-borrar"
                              onClick={() => borrar(comentario.id)}
                              aria-label="Borrar mi comentario"
                              title="Borrar mi comentario"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                        <p>{comentario.texto}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <form className="comentarios-form" onSubmit={enviar}>
              <textarea
                className="campo-formulario"
                rows={2}
                maxLength={1000}
                placeholder="Escribe un comentario para tu familia…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) enviar(e)
                }}
                aria-label="Nuevo comentario"
              />
              <button type="submit" className="boton boton-secundario" disabled={enviando || !texto.trim()}>
                <Send size={17} aria-hidden="true" />
                {enviando ? 'Enviando…' : 'Comentar'}
              </button>
            </form>
            {error && <p className="mensaje-error">{error}</p>}
          </>
        )
      )}
    </section>
  )
}

export default Comentarios
