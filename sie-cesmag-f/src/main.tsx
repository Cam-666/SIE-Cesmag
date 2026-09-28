import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'

async function preparar() {
  // Mientras el backend no cubra todos los módulos, MSW sigue disponible
  // para desarrollar sin depender de él (datos de ejemplo, ver src/mocks).
  // VITE_USE_MOCKS=false apunta en cambio al backend real (VITE_API_URL) —
  // útil para probar los módulos que ya están construidos ahí (auth,
  // usuarios/roles, emprendimientos). Los módulos que el backend real
  // todavía no tiene (entregables, asesorías, etc.) fallarán en ese modo
  // hasta que se construyan — es intencional, no un error.
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
