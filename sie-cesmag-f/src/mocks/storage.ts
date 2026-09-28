/**
 * Simula un backend compartido entre pestañas y sesiones: sin esto, cada
 * pestaña tendría su propia copia en memoria de los datos mock y los
 * cambios de una no se verían en otra. Los arreglos/objetos mutables de
 * `mocks/data/*` se guardan en localStorage y se avisan entre pestañas vía
 * BroadcastChannel; cada pestaña refresca su copia en memoria y luego
 * invalida su caché de TanStack Query.
 */
const PREFIJO = "sie-mock:"

function leer<T>(clave: string): T | null {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave)
    return crudo ? (JSON.parse(crudo) as T) : null
  } catch {
    return null
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
  } catch {
    // Almacenamiento lleno o no disponible (p. ej. modo privado): se sigue
    // trabajando en memoria para esta pestaña, solo se pierde la sincronía.
  }
}

const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("sie-mock-sync") : null

/** Envuelve recursivamente objetos/arreglos anidados para detectar también sus mutaciones. */
function envolver<T extends object>(valor: T, avisar: () => void): T {
  return new Proxy(valor, {
    get(target, prop, receiver) {
      const resultado = Reflect.get(target, prop, receiver)
      if (resultado !== null && typeof resultado === "object") {
        return envolver(resultado as object, avisar)
      }
      return resultado
    },
    set(target, prop, value, receiver) {
      const ok = Reflect.set(target, prop, value, receiver)
      avisar()
      return ok
    },
    deleteProperty(target, prop) {
      const ok = Reflect.deleteProperty(target, prop)
      avisar()
      return ok
    },
  }) as T
}

/** Referencias "en crudo" (sin proxy) de cada tabla persistida, para poder refrescarlas en sitio. */
const objetivosPorClave = new Map<string, object>()

/** Sincroniza en sitio el objeto/arreglo en memoria con lo último guardado por otra pestaña. */
function refrescarDesdeStorage(clave: string) {
  const objetivo = objetivosPorClave.get(clave)
  const actualizado = leer<object>(clave)
  if (!objetivo || !actualizado) return

  if (Array.isArray(objetivo) && Array.isArray(actualizado)) {
    objetivo.length = 0
    objetivo.push(...actualizado)
  } else {
    Object.keys(objetivo).forEach((k) => delete (objetivo as Record<string, unknown>)[k])
    Object.assign(objetivo, actualizado)
  }
}

// Se registra una sola vez: ante cualquier aviso de otra pestaña, refresca
// primero los datos en memoria (antes de que `alCambiarEnOtraPestana`
// dispare el refetch de las consultas activas).
canal?.addEventListener("message", (evento) => {
  const clave = (evento.data as { clave?: string } | undefined)?.clave
  if (typeof clave === "string") refrescarDesdeStorage(clave)
})

/**
 * Envuelve un arreglo/objeto mutable de datos mock para que cualquier
 * mutación, directa o anidada (p. ej. `entregable.intentos.push(...)`), se
 * guarde en localStorage y se anuncie a las demás pestañas.
 *
 * La escritura se agrupa en una microtarea porque métodos como `splice`
 * disparan varias operaciones `set` internas seguidas; guardar en cada paso
 * expondría a otras pestañas un estado a medio terminar. Posponer el
 * guardado hasta el final de la ráfaga evita eso.
 */
export function persistir<T extends object>(clave: string, semilla: T): T {
  const inicial = leer<T>(clave) ?? semilla
  objetivosPorClave.set(clave, inicial)
  let guardadoProgramado = false
  const avisar = () => {
    if (guardadoProgramado) return
    guardadoProgramado = true
    queueMicrotask(() => {
      guardadoProgramado = false
      escribir(clave, inicial)
      canal?.postMessage({ clave })
    })
  }
  return envolver(inicial, avisar)
}

/** Se suscribe a los cambios que hagan otras pestañas sobre cualquier tabla mock. */
export function alCambiarEnOtraPestana(callback: () => void): () => void {
  if (!canal) return () => {}
  const manejador = () => callback()
  canal.addEventListener("message", manejador)
  return () => canal.removeEventListener("message", manejador)
}
