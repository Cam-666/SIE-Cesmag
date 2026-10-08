/**
 * Envío de correo real por la API HTTP de Brevo (no SMTP — Railway bloquea
 * las conexiones salientes por los puertos que usa el correo tradicional).
 * Para migrar a otra cuenta de Brevo (p. ej. la de la Unidad de Emprendimiento
 * cuando esté disponible), basta con cambiar BREVO_API_KEY/BREVO_REMITENTE en
 * las variables de entorno — nada en este archivo ni en el resto del código cambia.
 */
export async function enviarCorreo(datos: { para: string; asunto: string; html: string }): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY
  const remitente = process.env.BREVO_REMITENTE
  if (!apiKey || !remitente) {
    console.warn("[correo] BREVO_API_KEY/BREVO_REMITENTE no configurados — no se envió nada.")
    return false
  }

  try {
    const respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: remitente, name: "SIE CESMAG" },
        to: [{ email: datos.para }],
        subject: datos.asunto,
        htmlContent: datos.html,
      }),
    })
    if (!respuesta.ok) {
      console.error("[correo] Brevo respondió con error:", respuesta.status, await respuesta.text())
      return false
    }
    return true
  } catch (err) {
    console.error("[correo] No se pudo enviar:", err)
    return false
  }
}
