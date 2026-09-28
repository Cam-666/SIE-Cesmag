import "dotenv/config"
import { crearApp } from "./app.js"

const puerto = process.env.PORT ? Number(process.env.PORT) : 4000

crearApp().listen(puerto, () => {
  console.log(`SIE CESMAG API escuchando en http://localhost:${puerto}`)
})
