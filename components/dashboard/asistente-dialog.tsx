"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PencilIcon, PlusIcon, SchoolIcon } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { asistenteSaveSchema, type AsistenteSave } from "@/lib/validators/asistente"
import { createAsistenteAction, updateAsistenteAction } from "@/app/actions/asistente"
import type { Asistente } from "@/db/schema"

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function EscuelaCombobox({
  value,
  onChange,
  schools,
}: {
  value: string
  onChange: (v: string) => void
  schools: string[]
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const suggestions = useMemo(() => {
    const q = normalize(value)
    if (!q) return schools
    return schools.filter((s) => normalize(s).includes(q))
  }, [schools, value])

  const isNew =
    value.trim() !== "" &&
    !schools.some((s) => normalize(s) === normalize(value.trim()))

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Escuela Primaria..."
      />
      {open && (suggestions.length > 0 || isNew) && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border bg-popover text-popover-foreground shadow-md">
          <div className="max-h-52 overflow-y-auto py-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={[
                  "w-full px-3 py-1.5 text-left text-sm transition-colors flex items-center gap-2",
                  normalize(s) === normalize(value.trim())
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50",
                ].join(" ")}
                onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false) }}
              >
                <SchoolIcon className="size-3.5 shrink-0 text-muted-foreground" />
                {s}
              </button>
            ))}
            {isNew && (
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50 flex items-center gap-2 border-t text-primary"
                onMouseDown={(e) => { e.preventDefault(); onChange(value.trim()); setOpen(false) }}
              >
                <PlusIcon className="size-3.5 shrink-0" />
                Registrar nueva: &ldquo;{value.trim()}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type Props = {
  asistente?: Asistente
  open: boolean
  onOpenChange: (open: boolean) => void
  schools?: string[]
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
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
  asistio: null,
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
    asistio: asistente.asistio ?? null,
  }
}

export function AsistenteDialog({ asistente, open, onOpenChange, schools = [] }: Props) {
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
        if (result.bookit.ok === true) {
          toast.success(`Bookit: ${result.bookit.response}`, { duration: 8000 })
        } else if (result.bookit.ok === "already_exists") {
          toast.info(`Bookit: ${result.bookit.message}`, { duration: 6000 })
        } else {
          toast.warning(`Bookit error: ${result.bookit.error}`, { duration: 8000 })
        }
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
              <Label>Escuela</Label>
              <Controller
                control={control}
                name="escuela"
                render={({ field }) => (
                  <EscuelaCombobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    schools={schools}
                  />
                )}
              />
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
              <Controller
                control={control}
                name="whatsApp"
                render={({ field }) => (
                  <Input
                    id="whatsApp"
                    type="tel"
                    placeholder="(442) 123-4567"
                    value={formatPhone(field.value ?? "")}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                    onBlur={field.onBlur}
                  />
                )}
              />
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

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="asistio" className="text-sm font-medium cursor-pointer">
                Asistencia
              </Label>
              <p className="text-xs text-muted-foreground">
                Marca si el asistente ya se presentó al evento
              </p>
            </div>
            <Controller
              control={control}
              name="asistio"
              render={({ field }) => (
                <Switch
                  id="asistio"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked ? true : null)}
                />
              )}
            />
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
