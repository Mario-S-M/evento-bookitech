import { z } from "zod"

export const asistenteSaveSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  escuela: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  correo: z
    .string()
    .email("Correo electrónico inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  whatsApp: z.string().optional().nullable(),
  bienestarSocioemocionalBullying: z.boolean(),
  asesoramientoAcademico: z.boolean(),
  seleccionDeLibrosYMateriales: z.boolean(),
  ventaYDistribucionDeMaterialesEscolares: z.boolean(),
  lugar: z.string().optional().nullable(),
  asistio: z.boolean().nullable().optional(),
})

export type AsistenteSave = z.infer<typeof asistenteSaveSchema>
