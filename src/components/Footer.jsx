import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { CATEGORIAS, iconoDeCategoria } from '../data/catalogo'
import Logotipo from './Logotipo'
import './Footer.css'

// Las primeras 4 categorías del catálogo son las que mostramos como "populares".
const CATEGORIAS_POPULARES = CATEGORIAS.slice(0, 4)

// Pie en grafito, como el de Pensil.Devs y Pensil.Pos.
function Footer() {
  const anioActual = new Date().getFullYear()

  function volverArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="contenedor footer-interior">
        <div className="footer-marca">
          <Logotipo sobreGrafito tamano="grande" />
          <p>
            Recetas caseras, el menú de la semana en familia y la lista de mercado lista para llevar.
          </p>
        </div>

        <nav aria-labelledby="footer-titulo-navegacion">
          <h2 id="footer-titulo-navegacion" className="footer-titulo">
            Pensil.Food
          </h2>
          <ul className="footer-enlaces">
            <li>
              <Link to="/recetas">Todas las recetas</Link>
            </li>
            <li>
              <Link to="/menu-semanal">Menú semanal</Link>
            </li>
            <li>
              <Link to="/favoritos">Favoritos</Link>
            </li>
            <li>
              <Link to="/familia">Mi familia</Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-titulo-categorias">
          <h2 id="footer-titulo-categorias" className="footer-titulo">
            Categorías
          </h2>
          <ul className="footer-enlaces">
            {CATEGORIAS_POPULARES.map((categoria) => {
              const Icono = iconoDeCategoria(categoria)
              return (
                <li key={categoria}>
                  <Link to={`/recetas?categoria=${encodeURIComponent(categoria)}`}>
                    <Icono size={18} aria-hidden="true" />
                    {categoria}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="footer-creditos">
        <div className="contenedor footer-creditos-interior">
          <p>© {anioActual} Pensil.Devs. Hecho en Pensilvania, Caldas.</p>
          <button type="button" className="footer-arriba" onClick={volverArriba}>
            Volver arriba
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
