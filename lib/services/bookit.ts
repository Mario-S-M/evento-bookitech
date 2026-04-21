import type { Asistente } from "@/db/schema"

const BOOKIT_URL = "https://bookitech.mx:4443/alicia/bookit_api/api/usuario/registrar"
const BOOKIT_TOKEN = "1a?+Y|F2B6kqzS8"

type BookitPayload = {
  nombre: string
  telefono: number
  correo: string
  contrasena: string
  codigoweb: string
}

function buildPayload(asistente: Asistente): BookitPayload {
  const nombreCompleto = [asistente.nombre, asistente.apellido].filter(Boolean).join(" ")
  const telefono = parseInt((asistente.whatsApp ?? "0").replace(/\D/g, ""), 10)

  return {
    nombre: nombreCompleto,
    telefono,
    correo: asistente.correo ?? "",
    contrasena: asistente.whatsApp ?? "",  // TODO: confirmar valor de contrasena
    codigoweb: "DEMO26",
  }
}

export async function pushAsistenteToBookit(asistente: Asistente): Promise<string> {
  const payload = buildPayload(asistente)

  console.log("[Bookit] payload enviado:", JSON.stringify(payload, null, 2))

  const res = await fetch(BOOKIT_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${BOOKIT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })

  const raw = await res.text().catch(() => "")

  let message: string
  try {
    const json = JSON.parse(raw) as Record<string, unknown>
    message = JSON.stringify(json, null, 2)
  } catch {
    message = raw
  }

  if (!res.ok) {
    throw new Error(`[${res.status}] ${message}`)
  }

  return message
}
