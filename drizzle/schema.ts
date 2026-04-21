import { pgTable, integer, text, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const asistencia = pgTable("asistencia", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "asistencia_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nombre: text("Nombre"),
	apellido: text("Apellido"),
	escuela: text("Escuela"),
	cargo: text("Cargo"),
	correo: text("Correo"),
	whatsApp: text("WhatsApp"),
	"bienestarSocioemocional /Bullying": boolean("Bienestar socioemocional / bullying"),
	"asesoramientoAcadémico": boolean("Asesoramiento Académico"),
	"selecciónDeLibrosYMateriales": boolean("Selección de libros y materiales"),
	"ventaYDistribuciónDeMaterialesEscolares": boolean("Venta y distribución de materiales escolares"),
	lugar: text("Lugar"),
});
