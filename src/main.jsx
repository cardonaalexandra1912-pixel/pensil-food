import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Los estilos globales van primero para que los de cada componente los refinen.
import './styles/global.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { FavoritosProvider } from './context/FavoritosContext'
import { RecetasProvider } from './context/RecetasContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/pensil-food">
      <AuthProvider>
        <RecetasProvider>
          <FavoritosProvider>
            <App />
          </FavoritosProvider>
        </RecetasProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
