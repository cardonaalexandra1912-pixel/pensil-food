import { useState } from 'react'
import './Avatar.css'

// Foto de perfil (la de Google si existe) o la inicial del nombre.
function Avatar({ nombre, url, tamano = 36 }) {
  const [fallo, setFallo] = useState(false)
  const inicial = (nombre || '?').trim().charAt(0).toUpperCase() || '?'
  const estilo = { width: tamano, height: tamano, fontSize: tamano * 0.42 }

  if (url && !fallo) {
    return (
      <img
        src={url}
        alt=""
        className="avatar"
        style={estilo}
        referrerPolicy="no-referrer"
        onError={() => setFallo(true)}
      />
    )
  }
  return (
    <span className="avatar avatar-inicial" style={estilo} aria-hidden="true">
      {inicial}
    </span>
  )
}

export default Avatar
