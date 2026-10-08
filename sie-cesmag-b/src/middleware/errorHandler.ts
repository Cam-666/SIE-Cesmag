import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import multer from "multer"

/** Error "de negocio" con código HTTP explícito — la forma normal de cortar un request desde un servicio. */
export class ErrorApi extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Middleware final: traduce cualquier error lanzado en una ruta (Express 5
 * reenvía automáticamente los rechazos de promesas async hasta aquí) a una
 * respuesta JSON consistente, sin filtrar detalles internos al cliente.
 */
export function manejadorErrores(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErrorApi) {
    return res.status(err.status).json({ message: err.message })
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Datos inválidos.", detalles: err.flatten() })
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "El archivo es demasiado grande." })
    }
    return res.status(400).json({ message: "No se pudo procesar el archivo." })
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un registro con ese dato único." })
    }
    if (err.code === "P2003" || err.code === "P2014") {
      return res.status(409).json({ message: "No se puede completar: hay datos relacionados." })
    }
  }
  console.error(err)
  return res.status(500).json({ message: "Error interno del servidor." })
}
