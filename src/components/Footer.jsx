import logo from '../assets/logo.jpg'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="contenedor footer-interior">
        <div className="footer-info">
          <img src={logo} alt="Alexandra's Kitchen" className="footer-logo" />
          <p className="footer-marca">Cocina casera, bien organizada</p>
          <p className="footer-nota">Recetario personal hecho con React</p>
          <a
            className="footer-ubicacion"
            href="https://www.google.com/maps/search/?api=1&query=Pensilvania,+Caldas,+Colombia"
            target="_blank"
            rel="noreferrer"
          >
            📍 Pensilvania, Caldas, Colombia
          </a>
          <a className="footer-ubicacion" href="tel:+573224302480">
            📞 322 430 2480
          </a>
        </div>

        <div className="footer-mapa">
          <iframe
            title="Mapa de Pensilvania, Caldas"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-75.2233%2C5.3236%2C-75.1033%2C5.4436&marker=5.38361%2C-75.16333&layer=mapnik"
            loading="lazy"
            tabIndex="-1"
          />
          <span className="footer-mapa-etiqueta">☕ Pensilvania, Caldas</span>
          <a
            className="footer-mapa-enlace"
            href="https://www.google.com/maps/search/?api=1&query=Pensilvania,+Caldas,+Colombia"
            target="_blank"
            rel="noreferrer"
            aria-label="Ver Pensilvania, Caldas en Google Maps"
          />
        </div>
      </div>
    </footer>
  )
}

export default Footer
