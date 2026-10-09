import { prisma } from "./prisma.js"

/**
 * Etapas donde este usuario administrativo es el responsable asignado (ver
 * "Responsables por etapa" en Usuarios y Roles). Quien no es responsable de
 * ninguna etapa recibe un arreglo vacío, que los servicios de Emprendimientos
 * y Entregables interpretan como "sin restricción" — ve todo, igual que antes
 * de existir esta función. La restricción solo se activa para quien sí tiene
 * una etapa asignada: en ese caso ve únicamente lo que está en curso ahí.
 */
export async function etapasResponsableDe(idUsuario: string): Promise<number[]> {
  const etapas = await prisma.etapa.findMany({
    where: { idUsuarioResponsable: idUsuario },
    select: { idEtapa: true },
  })
  return etapas.map((e) => e.idEtapa)
}
