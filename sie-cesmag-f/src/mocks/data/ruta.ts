import type { EtapaRuta } from "@/domain/ruta/types"
import { ETAPAS, FASES } from "@/domain/ruta/catalogo"

export const TOTAL_FASES = FASES.length

/** Construye la ruta completa marcando el estado de cada fase/etapa según cuántas fases se completaron. */
export function construirRuta(fasesCompletadas: number): EtapaRuta[] {
  return ETAPAS.map((etapa) => {
    const fases = FASES.filter((f) => f.idEtapa === etapa.idEtapa).map((fase) => ({
      idFase: fase.idFase,
      numero: fase.numero,
      nombre: fase.nombre,
      entregableRequerido: fase.entregablesRequeridos,
      estadoFase:
        fase.numero <= fasesCompletadas
          ? ("completada" as const)
          : fase.numero === fasesCompletadas + 1
            ? ("en_curso" as const)
            : ("pendiente" as const),
    }))

    const estado = fases.every((f) => f.estadoFase === "completada")
      ? ("completada" as const)
      : fases.every((f) => f.estadoFase === "pendiente")
        ? ("pendiente" as const)
        : ("en_curso" as const)

    return { idEtapa: etapa.idEtapa, numero: etapa.numero, nombre: etapa.nombre, estado, fases }
  })
}

export function faseActualDeRuta(ruta: EtapaRuta[]) {
  for (const etapa of ruta) {
    const fase = etapa.fases.find((f) => f.estadoFase === "en_curso")
    if (fase) return { etapa, fase }
  }
  // Todas completadas: la última fase de la última etapa.
  const ultimaEtapa = ruta[ruta.length - 1]
  return { etapa: ultimaEtapa, fase: ultimaEtapa.fases[ultimaEtapa.fases.length - 1] }
}
