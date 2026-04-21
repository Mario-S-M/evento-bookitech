import type { Asistente } from "@/db/schema"

const BOOKIT_URL = "https://bookitech.mx:4443/alicia/bookit_api/api/usuario/registrar"
const BOOKIT_TOKEN = "1a?+Y|F2B6kqzS8"

type BookitPayload = {
  nombre: string
  telefono: string
  codigoweb: string
  contrasena: string
  registrar: string
  correo: string
}

function buildPayload(asistente: Asistente): BookitPayload {
  return {
    nombre: [asistente.nombre, asistente.apellido].filter(Boolean).join(" "),
    telefono: asistente.whatsApp ?? "",
    codigoweb: String(asistente.id),   // TODO: confirmar qué valor va aquí
    contrasena: asistente.correo ?? String(asistente.id), // TODO: confirmar
    registrar: "1",                    // TODO: confirmar valor
    correo: asistente.correo ?? "",
  }
}

export async function pushAsistenteToBookit(asistente: Asistente): Promise<void> {
  const payload = buildPayload(asistente)

  const res = await fetch(BOOKIT_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${BOOKIT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Bookit API error ${res.status}: ${body}`)
  }
}
