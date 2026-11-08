import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Campo de contraseña con botón para verla mientras se escribe.
function CampoContrasena({ id, etiqueta, valor, alCambiar, autoComplete, ayuda }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="ingresar-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div className="ingresar-contrasena">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="campo-formulario"
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          autoComplete={autoComplete}
          minLength={6}
          required
          aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((actual) => !actual)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {ayuda && (
        <p id={`${id}-ayuda`} className="ingresar-ayuda">
          {ayuda}
        </p>
      )}
    </div>
  )
}

export default CampoContrasena
