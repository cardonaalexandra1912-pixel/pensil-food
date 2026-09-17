import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpg'
import { CATEGORIAS, ICONOS_CATEGORIA } from '../data/recetas'
import './Footer.css'

// Las primeras 4 categorías del catálogo son las que mostramos como "populares".
const CATEGORIAS_POPULARES = CATEGORIAS.slice(0, 4)

function Footer() {
  const anioActual = new Date().getFullYear()

  function volverArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      {/* Ola decorativa: el relleno es transparente por encima del trazo,
          así se ve el fondo crema de la página asomando detrás. */}
      <svg className="footer-ola" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,60 L0,60 Z" />
      </svg>

      <div className="footer-cuerpo">
        <span className="footer-decoracion" aria-hidden="true">
          🍃
        </span>

        <div className="contenedor footer-interior">
          <div className="footer-columna footer-marca">
            <Link to="/" className="footer-logo-enlace">
              <span className="footer-logo-marco">
                <img src={logo} alt="" className="footer-logo" />
              </span>
              <span className="footer-nombre">Mis Recetas</span>
            </Link>
            <p className="footer-frase">Cocina casera, bien organizada</p>
          </div>

          <div className="footer-columna">
            <h4 className="footer-titulo">Links rápidos</h4>
            <nav className="footer-enlaces">
              <Link to="/">Inicio</Link>
              <Link to="/recetas">Recetas</Link>
              <Link to="/menu-semanal">Menú Semanal</Link>
              <Link to="/favoritos">Favoritos</Link>
            </nav>
          </div>

          <div className="footer-columna">
            <h4 className="footer-titulo">Categorías populares</h4>
            <nav className="footer-enlaces">
              {CATEGORIAS_POPULARES.map((categoria) => (
                <Link key={categoria} to={`/recetas?categoria=${encodeURIComponent(categoria)}`}>
                  <span className="footer-enlace-icono">{ICONOS_CATEGORIA[categoria]}</span>
                  {categoria}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="contenedor footer-creditos">
          <p>© {anioActual} Mis Recetas. Hecho con cariño en la cocina. 💚</p>
          <button type="button" className="footer-arriba" onClick={volverArriba}>
            Volver arriba ↑
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
