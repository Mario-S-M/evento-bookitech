"use client"

import { useEffect, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PencilIcon, PlusIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { asistenteSaveSchema, type AsistenteSave } from "@/lib/validators/asistente"
import { createAsistenteAction, updateAsistenteAction } from "@/app/actions/asistente"
import type { Asistente } from "@/db/schema"

type Props = {
  asistente?: Asistente
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_VALUES: AsistenteSave = {
  nombre: "",
  apellido: "",
  escuela: "",
  cargo: "",
  correo: "",
  whatsApp: "",
  bienestarSocioemocionalBullying: false,
  asesoramientoAcademico: false,
  seleccionDeLibrosYMateriales: false,
  ventaYDistribucionDeMaterialesEscolares: false,
  lugar: "",
}

function toFormValues(asistente: Asistente): AsistenteSave {
  return {
    nombre: asistente.nombre ?? "",
    apellido: asistente.apellido ?? "",
    escuela: asistente.escuela ?? "",
    cargo: asistente.cargo ?? "",
    correo: asistente.correo ?? "",
    whatsApp: asistente.whatsApp ?? "",
    bienestarSocioemocionalBullying: asistente.bienestarSocioemocionalBullying ?? false,
    asesoramientoAcademico: asistente.asesoramientoAcademico ?? false,
    seleccionDeLibrosYMateriales: asistente.seleccionDeLibrosYMateriales ?? false,
    ventaYDistribucionDeMaterialesEscolares: asistente.ventaYDistribucionDeMaterialesEscolares ?? false,
    lugar: asistente.lugar ?? "",
  }
}

export function AsistenteDialog({ asistente, open, onOpenChange }: Props) {
  const isEditing = !!asistente
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AsistenteSave>({
    resolver: zodResolver(asistenteSaveSchema),
    defaultValues: asistente ? toFormValues(asistente) : EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(asistente ? toFormValues(asistente) : EMPTY_VALUES)
    }
  }, [open, asistente, reset])

  function onSubmit(data: AsistenteSave) {
    startTransition(async () => {
      const result = isEditing
        ? await updateAsistenteAction(asistente.id, data)
        : await createAsistenteAction(data)

      if (result.success) {
        toast.success(isEditing ? "Asistente actualizado" : "Asistente creado")
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar asistente" : "Nuevo asistente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...register("nombre")} placeholder="Juan" />
              {errors.nombre && (
                <p className="text-xs text-destructive">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input id="apellido" {...register("apellido")} placeholder="García" />
              {errors.apellido && (
                <p className="text-xs text-destructive">{errors.apellido.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="escuela">Escuela</Label>
              <Input id="escuela" {...register("escuela")} placeholder="Escuela Primaria..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" {...register("cargo")} placeholder="Director, Docente..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correo">Correo</Label>
              <Input id="correo" type="email" {...register("correo")} placeholder="correo@ejemplo.com" />
              {errors.correo && (
                <p className="text-xs text-destructive">{errors.correo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsApp">WhatsApp</Label>
              <Input id="whatsApp" {...register("whatsApp")} placeholder="771 123 4567" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lugar">Lugar</Label>
              <Input id="lugar" {...register("lugar")} placeholder="Ciudad, Municipio..." />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Talleres de interés</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name="bienestarSocioemocionalBullying"
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm">Bienestar socioemocional / Bullying</span>
                  </label>
                )}
              />

              <Controller
                control={control}
                name="asesoramientoAcademico"
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm">Asesoramiento Académico</span>
                  </label>
                )}
              />

              <Controller
                control={control}
                name="seleccionDeLibrosYMateriales"
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm">Selección de libros y materiales</span>
                  </label>
                )}
              />

              <Controller
                control={control}
                name="ventaYDistribucionDeMaterialesEscolares"
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm">Venta y distribución de materiales</span>
                  </label>
                )}
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear asistente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type TriggerProps = {
  asistente?: Asistente
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AsistenteTriggerButton({ asistente, onOpenChange }: Omit<TriggerProps, "open">) {
  if (asistente) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onOpenChange(true)}
        aria-label="Editar asistente"
      >
        <PencilIcon />
      </Button>
    )
  }

  return (
    <Button onClick={() => onOpenChange(true)}>
      <PlusIcon />
      Nuevo asistente
    </Button>
  )
}
