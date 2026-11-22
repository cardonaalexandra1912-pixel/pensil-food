import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import BarraInferior from './components/BarraInferior'
import WhatsappFlotante from './components/WhatsappFlotante'
import RutaProtegida from './components/RutaProtegida'
import { tomarRutaPendiente, useAuth } from './context/AuthContext'
import Inicio from './pages/Inicio'
import Recetas from './pages/Recetas'
import DetalleReceta from './pages/DetalleReceta'
import FormularioReceta from './pages/FormularioReceta'
import MenuSemanal from './pages/MenuSemanal'
import Favoritos from './pages/Favoritos'
import Ingresar from './pages/Ingresar'
import NuevaContrasena from './pages/NuevaContrasena'
import Familia from './pages/Familia'

// Al volver de Google, lleva al usuario a la página desde la que pidió ingresar.
function RedireccionTrasIngreso() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!usuario) return
    const ruta = tomarRutaPendiente()
    if (ruta && ruta !== '/') navigate(ruta, { replace: true })
  }, [usuario, navigate])
  return null
}

// Al cambiar de sección se empieza arriba, como en cualquier app (salvo que la
// dirección apunte a una parte de la página, como #lista-mercado).
function ArribaAlNavegar({ ruta, hash }) {
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [ruta, hash])
  return null
}

function App() {
  const { usuario, cargando } = useAuth()
  const { pathname, hash } = useLocation()

  return (
    <div className={usuario ? 'app app-con-sesion' : 'app'}>
      <RedireccionTrasIngreso />
      <Header />
      <ArribaAlNavegar ruta={pathname} hash={hash} />
      <main>
        {/* La llave reinicia el fundido cada vez que se cambia de sección. */}
        <div key={pathname} className="pagina-entrada">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route
              path="/recetas/nueva"
              element={
                <RutaProtegida>
                  <FormularioReceta />
                </RutaProtegida>
              }
            />
            <Route path="/recetas/:id" element={<DetalleReceta />} />
            <Route
              path="/recetas/:id/editar"
              element={
                <RutaProtegida>
                  <FormularioReceta />
                </RutaProtegida>
              }
            />
            <Route
              path="/menu-semanal"
              element={
                <RutaProtegida>
                  <MenuSemanal />
                </RutaProtegida>
              }
            />
            <Route
              path="/favoritos"
              element={
                <RutaProtegida>
                  <Favoritos />
                </RutaProtegida>
              }
            />
            <Route
              path="/familia"
              element={
                <RutaProtegida>
                  <Familia />
                </RutaProtegida>
              }
            />
            <Route path="/ingresar" element={<Ingresar />} />
            <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
          </Routes>
        </div>
      </main>
      {/* Con sesión la app es una herramienta: sin pie de página, con pestañas abajo. */}
      {usuario ? <BarraInferior /> : !cargando && <Footer />}
      {!usuario && <WhatsappFlotante />}
    </div>
  )
}

export default App
