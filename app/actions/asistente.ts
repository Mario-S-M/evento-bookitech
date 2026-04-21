"use server"

import { revalidatePath } from "next/cache"
import { asistenteSaveSchema, type AsistenteSave } from "@/lib/validators/asistente"
import { createAsistente, updateAsistente, setAsistencia } from "@/lib/repositories/asistente"
import { pushAsistenteToBookit } from "@/lib/services/bookit"
import type { Asistente } from "@/db/schema"

const BOOKIT_ALREADY_EXISTS = "La cuenta ya esta registrada"

type BookitResult =
  | { ok: true; response: string }
  | { ok: "already_exists"; message: string }
  | { ok: false; error: string }

type ActionResult<T> =
  | { success: true; data: T; bookit: BookitResult }
  | { success: false; error: string }

async function syncToBookit(asistente: Asistente): Promise<BookitResult> {
  try {
    const response = await pushAsistenteToBookit(asistente)
    return { ok: true, response }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Error desconocido"
    console.error("[Bookit sync]", error)
    if (error.includes(BOOKIT_ALREADY_EXISTS)) {
      return { ok: "already_exists", message: "El usuario ya estaba registrado en Bookit" }
    }
    return { ok: false, error }
  }
}

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
    const bookit = await syncToBookit(asistente)
    return { success: true, data: asistente, bookit }
  } catch {
    return { success: false, error: "Error al crear el asistente" }
  }
}

export async function setAsistenciaAction(
  id: number,
  value: boolean | null
): Promise<{ success: boolean }> {
  try {
    await setAsistencia(id, value)
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { success: false }
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
    const bookit = await syncToBookit(asistente)
    return { success: true, data: asistente, bookit }
  } catch {
    return { success: false, error: "Error al actualizar el asistente" }
  }
}
