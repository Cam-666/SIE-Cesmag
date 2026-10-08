import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'

async function preparar() {
  // El backend real ya cubre todos los módulos — MSW sigue disponible solo
  // para desarrollar con datos de ejemplo sin depender de una base de datos
  // real (ver src/mocks). VITE_USE_MOCKS=false apunta en cambio a la API
  // real (VITE_API_URL).
  const usarMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (import.meta.env.DEV && usarMocks) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

preparar().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
