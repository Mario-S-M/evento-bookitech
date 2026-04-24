import { eq } from "drizzle-orm"
import { getDb } from "@/db"
import { asistencia, type Asistente } from "@/db/schema"
import type { AsistenteSave } from "@/lib/validators/asistente"

export async function getAllAsistentes(): Promise<Asistente[]> {
  return getDb().select().from(asistencia).orderBy(asistencia.id)
}

export async function getAsistenteById(id: number): Promise<Asistente | undefined> {
  const [row] = await getDb().select().from(asistencia).where(eq(asistencia.id, id))
  return row
}

export async function createAsistente(data: AsistenteSave): Promise<Asistente> {
  const [row] = await getDb()
    .insert(asistencia)
    .values({
      nombre: data.nombre,
      apellido: data.apellido,
      escuela: data.escuela ?? null,
      cargo: data.cargo ?? null,
      correo: data.correo || null,
      whatsApp: data.whatsApp ?? null,
      bienestarSocioemocionalBullying: data.bienestarSocioemocionalBullying,
      asesoramientoAcademico: data.asesoramientoAcademico,
      seleccionDeLibrosYMateriales: data.seleccionDeLibrosYMateriales,
      ventaYDistribucionDeMaterialesEscolares: data.ventaYDistribucionDeMaterialesEscolares,
      lugar: data.lugar ?? null,
      asistio: data.asistio ?? null,
    })
    .returning()
  return row
}

export async function setAsistencia(id: number, value: boolean | null): Promise<void> {
  await getDb()
    .update(asistencia)
    .set({ asistio: value })
    .where(eq(asistencia.id, id))
}

export async function updateAsistente(id: number, data: AsistenteSave): Promise<Asistente> {
  const [row] = await getDb()
    .update(asistencia)
    .set({
      nombre: data.nombre,
      apellido: data.apellido,
      escuela: data.escuela ?? null,
      cargo: data.cargo ?? null,
      correo: data.correo || null,
      whatsApp: data.whatsApp ?? null,
      bienestarSocioemocionalBullying: data.bienestarSocioemocionalBullying,
      asesoramientoAcademico: data.asesoramientoAcademico,
      seleccionDeLibrosYMateriales: data.seleccionDeLibrosYMateriales,
      ventaYDistribucionDeMaterialesEscolares: data.ventaYDistribucionDeMaterialesEscolares,
      lugar: data.lugar ?? null,
      asistio: data.asistio ?? null,
    })
    .where(eq(asistencia.id, id))
    .returning()
  return row
}
