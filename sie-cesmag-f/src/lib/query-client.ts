import { QueryClient } from "@tanstack/react-query"

// staleTime moderado: los listados/dashboards no necesitan refetch agresivo
// (RNF-07: las consultas deben cargar en no más de 5s), pero sí reflejar
// cambios razonablemente pronto tras una acción del coordinador.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
