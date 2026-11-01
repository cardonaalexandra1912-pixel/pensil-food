import './Cargando.css'

function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <span className="cargando-rueda" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}

export default Cargando
