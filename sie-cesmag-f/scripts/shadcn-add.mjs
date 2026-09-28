#!/usr/bin/env node
// El CLI de shadcn (v4.21.0) no resuelve el alias "@/*" contra tsconfig en
// este entorno: crea literalmente una carpeta "@/" en la raíz del proyecto
// en vez de escribir dentro de "src/". Este script ejecuta el CLI y luego
// reubica el resultado a src/, dejando el proyecto como si el alias se
// hubiera resuelto correctamente.
//
// Uso: pnpm ui:add <componente...>   (ej. pnpm ui:add button input select)

import { execSync } from "node:child_process"
import { cpSync, existsSync, rmSync } from "node:fs"

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error("Uso: pnpm ui:add <componente...>")
  process.exit(1)
}

execSync(`pnpm exec shadcn add ${args.join(" ")} --yes`, { stdio: "inherit" })

if (existsSync("@")) {
  cpSync("@", "src", { recursive: true })
  rmSync("@", { recursive: true, force: true })
  console.log("\n✔ Componentes reubicados en src/")
} else {
  console.log("\n(No se generó carpeta \"@/\": nada que reubicar.)")
}
