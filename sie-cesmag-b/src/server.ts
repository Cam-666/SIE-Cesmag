import "dotenv/config"
import cron from "node-cron"
import { crearApp } from "./app.js"
import { ejecutarTareasDiarias } from "./modules/notificaciones/tareasProgramadas.service.js"

const puerto = process.env.PORT ? Number(process.env.PORT) : 4000

crearApp().listen(puerto, () => {
  console.log(`SIE CESMAG API escuchando en http://localhost:${puerto}`)
})

// Recordatorios de asesorías/entregables próximos y de inactividad
// (RF-12, RF-33, RF-34) — una vez al día, 7:00 a. m. hora Colombia.
cron.schedule(
  "0 7 * * *",
  () => {
    ejecutarTareasDiarias().catch((err) => console.error("[tareas programadas] error:", err))
  },
  { timezone: "America/Bogota" },
)
