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
  const digitosPhone = (asistente.whatsApp ?? "").replace(/\D/g, "")
  const telefono = digitosPhone ? parseInt(digitosPhone, 10) : 0

  return {
    nombre: nombreCompleto,
    telefono,
    correo: asistente.correo ?? "",
    contrasena: "demo123",
    codigoweb: "DEMO26",
  }
}

function validatePayload(payload: BookitPayload): string | null {
  if (!payload.nombre.trim()) return "El nombre del asistente es requerido"
  if (!payload.correo.trim()) return "El correo es requerido para sincronizar con Bookit"
  if (!payload.telefono) return "El WhatsApp es requerido para sincronizar con Bookit"
  return null
}

export async function pushAsistenteToBookit(asistente: Asistente): Promise<string> {
  const payload = buildPayload(asistente)

  const validationError = validatePayload(payload)
  if (validationError) throw new Error(validationError)

  const formBody = new URLSearchParams({
    nombre: payload.nombre,
    telefono: String(payload.telefono),
    correo: payload.correo,
    contrasena: payload.contrasena,
    codigoweb: payload.codigoweb,
  })

  console.log("[Bookit] payload (form):", formBody.toString())
  console.log("[Bookit] payload (json):", JSON.stringify(payload, null, 2))

  const res = await fetch(BOOKIT_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${BOOKIT_TOKEN}`,
    },
    body: formBody.toString(),
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
