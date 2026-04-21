import { pgTable, integer, text, boolean } from "drizzle-orm/pg-core"

export const asistencia = pgTable("asistencia", {
  id: integer().primaryKey().generatedAlwaysAsIdentity({
    name: "asistencia_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  nombre: text("Nombre"),
  apellido: text("Apellido"),
  escuela: text("Escuela"),
  cargo: text("Cargo"),
  correo: text("Correo"),
  whatsApp: text("WhatsApp"),
  bienestarSocioemocionalBullying: boolean("Bienestar socioemocional / bullying"),
  asesoramientoAcademico: boolean("Asesoramiento Académico"),
  seleccionDeLibrosYMateriales: boolean("Selección de libros y materiales"),
  ventaYDistribucionDeMaterialesEscolares: boolean("Venta y distribución de materiales escolares"),
  lugar: text("Lugar"),
})

export type Asistente = typeof asistencia.$inferSelect
export type AsistenteInsert = typeof asistencia.$inferInsert
