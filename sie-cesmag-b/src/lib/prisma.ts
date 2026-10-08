import { PrismaClient } from "@prisma/client"

/** Cliente único de Prisma para todo el servidor. */
export const prisma = new PrismaClient()
