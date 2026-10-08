// Raíz de la aplicación: envuelve todo en el router del navegador y en los
// providers globales (React Query, tema, etc. — ver app/providers.tsx) antes
// de renderizar las rutas reales.
import { BrowserRouter } from "react-router-dom"
import { AppProviders } from "@/app/providers"
import { AppRouter } from "@/app/router"

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  )
}

export default App
