"use server"

import { revalidatePath } from "next/cache"
import { asistenteSaveSchema, type AsistenteSave } from "@/lib/validators/asistente"
import {
  createAsistente,
  updateAsistente,
} from "@/lib/repositories/asistente"
import type { Asistente } from "@/db/schema"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createAsistenteAction(
  data: AsistenteSave
): Promise<ActionResult<Asistente>> {
  const parsed = asistenteSaveSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const asistente = await createAsistente(parsed.data)
    revalidatePath("/dashboard")
    return { success: true, data: asistente }
  } catch {
    return { success: false, error: "Error al crear el asistente" }
  }
}

export async function updateAsistenteAction(
  id: number,
  data: AsistenteSave
): Promise<ActionResult<Asistente>> {
  const parsed = asistenteSaveSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const asistente = await updateAsistente(id, parsed.data)
    revalidatePath("/dashboard")
    return { success: true, data: asistente }
  } catch {
    return { success: false, error: "Error al actualizar el asistente" }
  }
}
