import { useEffect, type ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { alCambiarEnOtraPestana } from "@/mocks/storage"

/**
 * Mientras no hay backend real, otra pestaña/sesión (p. ej. el coordinador
 * creando un entregable mientras el emprendedor tiene su portal abierto)
 * avisa sus cambios vía BroadcastChannel; al recibirlos, se refresca todo
 * lo que esta pestaña tenga en pantalla para que se vea reflejado.
 */
function useSincronizacionEntrePestanas() {
  useEffect(() => alCambiarEnOtraPestana(() => queryClient.invalidateQueries()), [])
}

export function AppProviders({ children }: { children: ReactNode }) {
  useSincronizacionEntrePestanas()

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
