import type { ReactNode } from "react"
import escudoCesmag from "@/assets/escudo-cesmag.png"
import universidadCesmag from "@/assets/universidad-cesmag.jpg"

/**
 * Layout compartido por las pantallas públicas de autenticación (Login,
 * Recuperar/Restablecer contraseña): foto de la Universidad CESMAG a pantalla
 * completa como fondo, con un velo azul institucional para mantener la
 * paleta y la legibilidad, y la tarjeta de acceso centrada sobre ella.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <img
        src={universidadCesmag}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/92 via-primary-900/80 to-primary-900/95" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-destructive-700/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-600/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={escudoCesmag} alt="Escudo Universidad CESMAG" className="h-12 w-12" />
          <p className="text-2xl font-bold tracking-wide text-white">SIE Cesmag</p>
        </div>
        {children}
      </div>
    </div>
  )
}
