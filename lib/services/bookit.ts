import type { Asistente } from "@/db/schema"

const BOOKIT_URL = "https://bookitech.mx:4443/alicia/bookit_api/api/usuario/registrar"
const BOOKIT_TOKEN = "1a?+Y|F2B6kqzS8"

const INTERES_LABELS: Record<string, string> = {
  bienestarSocioemocionalBullying: "Bienestar socioemocional / bullying",
  asesoramientoAcademico: "Asesoramiento Académico",
  seleccionDeLibrosYMateriales: "Selección de libros y materiales",
  ventaYDistribucionDeMaterialesEscolares: "Venta y distribución de materiales escolares",
}

type BookitPayload = {
  nombre: string
  apellido: string
  escuela: string
  cargo: string
  cargoOtro: string
  intereses: string[]
  correo: string
  whatsapp: string
  sede: string
  interes_bienestar_socioemocional_bullying: boolean
  interes_asesoramiento_academico: boolean
  interes_seleccion_libros_materiales: boolean
  interes_venta_distribucion_materiales_escolares: boolean
  interes_programas_lectura_ferias: boolean
}

function buildIntereses(asistente: Asistente): string[] {
  const intereses: string[] = []
  if (asistente.bienestarSocioemocionalBullying) intereses.push(INTERES_LABELS.bienestarSocioemocionalBullying)
  if (asistente.asesoramientoAcademico) intereses.push(INTERES_LABELS.asesoramientoAcademico)
  if (asistente.seleccionDeLibrosYMateriales) intereses.push(INTERES_LABELS.seleccionDeLibrosYMateriales)
  if (asistente.ventaYDistribucionDeMaterialesEscolares) intereses.push(INTERES_LABELS.ventaYDistribucionDeMaterialesEscolares)
  return intereses
}

function buildPayload(asistente: Asistente): BookitPayload {
  return {
    nombre: asistente.nombre ?? "",
    apellido: asistente.apellido ?? "",
    escuela: asistente.escuela ?? "",
    cargo: asistente.cargo ?? "",
    cargoOtro: "",
    intereses: buildIntereses(asistente),
    correo: asistente.correo ?? "",
    whatsapp: asistente.whatsApp ?? "",
    sede: (asistente.lugar ?? "").toLowerCase(),
    interes_bienestar_socioemocional_bullying: asistente.bienestarSocioemocionalBullying ?? false,
    interes_asesoramiento_academico: asistente.asesoramientoAcademico ?? false,
    interes_seleccion_libros_materiales: asistente.seleccionDeLibrosYMateriales ?? false,
    interes_venta_distribucion_materiales_escolares: asistente.ventaYDistribucionDeMaterialesEscolares ?? false,
    interes_programas_lectura_ferias: false,
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
