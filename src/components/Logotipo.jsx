import { Link } from 'react-router-dom'
import marca from '../assets/logo.jpg'
import './Logotipo.css'

// Logotipo de Pensil.Food: la marca (la P con gorro de chef, en trazo dorado)
// seguida de «Pensil» en ink y «.Food» en pencil-text, como Pensil.Devs y
// Pensil.Pos. La marca tiene colores fijos: va sobre su propio fondo blanco
// para verse igual en modo claro, oscuro y sobre grafito.
function Logotipo({ sobreGrafito = false, tamano = 'normal', alNavegar }) {
  return (
    <Link
      to="/"
      className={`logotipo logotipo-${tamano} ${sobreGrafito ? 'logotipo-grafito' : ''}`}
      aria-label="Pensil.Food, ir al inicio"
      onClick={alNavegar}
    >
      <span className="logotipo-marca">
        <img src={marca} alt="" />
      </span>
      <span className="logotipo-texto" aria-hidden="true">
        Pensil<span className="logotipo-producto">.Food</span>
      </span>
    </Link>
  )
}

export default Logotipo
