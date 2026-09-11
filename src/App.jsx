import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Inicio from './pages/Inicio'
import Recetas from './pages/Recetas'
import DetalleReceta from './pages/DetalleReceta'
import MenuSemanal from './pages/MenuSemanal'
import Favoritos from './pages/Favoritos'

function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/recetas/:id" element={<DetalleReceta />} />
          <Route path="/menu-semanal" element={<MenuSemanal />} />
          <Route path="/favoritos" element={<Favoritos />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
