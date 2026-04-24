"use client"

import { useState, useMemo, Fragment, useTransition, useRef, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchIcon, MailIcon, PhoneIcon, SchoolIcon, BriefcaseIcon, CheckIcon, XIcon, ClockIcon } from "lucide-react"
import { AsistenteDialog, AsistenteTriggerButton } from "@/components/dashboard/asistente-dialog"
import { setAsistenciaAction } from "@/app/actions/asistente"
import type { Asistente } from "@/db/schema"

const PAGE_SIZE = 10

type Props = { data: Asistente[] }
type TabValue = "todos" | "queretaro" | "morelia" | "esc-queretaro" | "esc-morelia"

type EscuelaRow = { escuela: string; total: number; asistentes: Asistente[] }

const TAB_LABELS: Record<TabValue, string> = {
  todos: "Todos",
  queretaro: "Querétaro",
  morelia: "Morelia",
  "esc-queretaro": "Esc. Querétaro",
  "esc-morelia": "Esc. Morelia",
}

const TAB_LABELS_SHORT: Record<TabValue, string> = {
  todos: "Todos",
  queretaro: "Qro",
  morelia: "Mor",
  "esc-queretaro": "E.Qro",
  "esc-morelia": "E.Mor",
}

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function toTitleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function isQueretaro(a: Asistente): boolean {
  const l = normalize(a.lugar ?? "")
  return l.includes("queretaro") || l.includes("qro")
}

function isMorelia(a: Asistente): boolean {
  return normalize(a.lugar ?? "").includes("morelia")
}

function matchesTab(asistente: Asistente, tab: TabValue): boolean {
  if (tab === "todos") return true
  if (tab === "queretaro") return isQueretaro(asistente)
  if (tab === "morelia") return isMorelia(asistente)
  return true
}

function matchesSearch(asistente: Asistente, query: string): boolean {
  const q = normalize(query)
  return (
    normalize(asistente.nombre ?? "").includes(q) ||
    normalize(asistente.apellido ?? "").includes(q) ||
    normalize(asistente.escuela ?? "").includes(q) ||
    normalize(asistente.cargo ?? "").includes(q) ||
    normalize(asistente.correo ?? "").includes(q)
  )
}

function groupByEscuela(asistentes: Asistente[]): EscuelaRow[] {
  const map = new Map<string, { display: string; items: Asistente[] }>()
  for (const a of asistentes) {
    const raw = a.escuela?.trim() ?? ""
    const key = raw ? normalize(raw) : "\x00"
    if (!map.has(key)) map.set(key, { display: raw ? toTitleCase(raw) : "(Sin escuela)", items: [] })
    map.get(key)!.items.push(a)
  }
  return Array.from(map.values())
    .map(({ display, items }) => ({ escuela: display, total: items.length, asistentes: items }))
    .sort((a, b) => b.total - a.total)
}

function buildPageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push("...")
  pages.push(total)
  return pages
}

// ── Botón de asistencia ────────────────────────────────────────────────────────
function AsistenciaButton({ asistente }: { asistente: Asistente }) {
  const [status, setStatus] = useState<boolean | null>(asistente.asistio ?? null)
  const [isPending, startTransition] = useTransition()

  function next(current: boolean | null): boolean | null {
    if (current === null) return true
    if (current === true) return false
    return null
  }

  function handleClick() {
    const current = status
    const nextVal = next(current)
    startTransition(async () => {
      setStatus(nextVal)
      const result = await setAsistenciaAction(asistente.id, nextVal)
      if (!result.success) setStatus(current)
    })
  }

  if (status === true) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 gap-1.5 h-7 px-2 text-xs"
        disabled={isPending}
        onClick={handleClick}
      >
        <CheckIcon className="size-3" />
        Asistió
      </Button>
    )
  }

  if (status === false) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 gap-1.5 h-7 px-2 text-xs"
        disabled={isPending}
        onClick={handleClick}
      >
        <XIcon className="size-3" />
        No asistió
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-muted-foreground gap-1.5 h-7 px-2 text-xs"
      disabled={isPending}
      onClick={handleClick}
    >
      <ClockIcon className="size-3" />
      Pendiente
    </Button>
  )
}

// ── Vista de escuelas agrupadas ────────────────────────────────────────────────
function EscuelasView({ rows, search }: { rows: EscuelaRow[]; search: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = normalize(search)
    return q ? rows.filter((r) => normalize(r.escuela).includes(q)) : rows
  }, [rows, search])

  function toggle(escuela: string) {
    setExpanded((prev) => (prev === escuela ? null : escuela))
  }

  const emptyMsg = search ? "Sin resultados." : "No hay escuelas registradas."

  return (
    <>
      {/* ── Tabla desktop ── */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3">Escuela</TableHead>
              <TableHead className="px-3 w-24 text-center">Asistentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-sm text-muted-foreground">
                  {emptyMsg}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <Fragment key={row.escuela}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggle(row.escuela)}
                  >
                    <TableCell className="px-3 text-sm font-medium">{row.escuela}</TableCell>
                    <TableCell className="px-3 text-center">
                      <Badge variant="secondary">{row.total}</Badge>
                    </TableCell>
                  </TableRow>
                  {expanded === row.escuela && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={2} className="px-6 py-2">
                        <ul className="space-y-1">
                          {row.asistentes.map((a) => (
                            <li key={a.id} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                              {[a.nombre, a.apellido].filter(Boolean).join(" ") || "—"}
                              {a.cargo && <span className="text-xs">· {a.cargo}</span>}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Cards móvil ── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">{emptyMsg}</p>
        ) : (
          filtered.map((row) => (
            <div key={row.escuela} className="rounded-xl border bg-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                onClick={() => toggle(row.escuela)}
              >
                <span className="text-sm font-medium">{row.escuela}</span>
                <Badge variant="secondary">{row.total}</Badge>
              </button>
              {expanded === row.escuela && (
                <div className="border-t bg-muted/30 px-4 pb-3 pt-2">
                  <ul className="space-y-1">
                    {row.asistentes.map((a) => (
                      <li key={a.id} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                        {[a.nombre, a.apellido].filter(Boolean).join(" ") || "—"}
                        {a.cargo && <span className="text-xs">· {a.cargo}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}

// ── Card móvil ─────────────────────────────────────────────────────────────────
function AsistenteCard({ asistente, onEdit }: { asistente: Asistente; onEdit: () => void }) {
  const nombre = [asistente.nombre, asistente.apellido].filter(Boolean).join(" ") || "—"
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm leading-tight">{nombre}</p>
          <p className="text-xs text-muted-foreground mt-0.5">#{asistente.id}</p>
        </div>
        <AsistenteTriggerButton asistente={asistente} onOpenChange={onEdit} />
      </div>
      <div className="grid grid-cols-1 gap-1.5 text-sm">
        {asistente.escuela && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <SchoolIcon className="size-3.5 shrink-0" />
            <span className="truncate">{asistente.escuela}</span>
          </div>
        )}
        {asistente.cargo && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <BriefcaseIcon className="size-3.5 shrink-0" />
            <span className="truncate">{asistente.cargo}</span>
          </div>
        )}
        {asistente.correo && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MailIcon className="size-3.5 shrink-0" />
            <span className="truncate">{asistente.correo}</span>
          </div>
        )}
        {asistente.whatsApp && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <PhoneIcon className="size-3.5 shrink-0" />
            <span>{asistente.whatsApp}</span>
          </div>
        )}
      </div>
      <div className="pt-1 border-t">
        <AsistenciaButton asistente={asistente} />
      </div>
    </div>
  )
}

// ── Filtro de escuela con buscador ────────────────────────────────────────────
type SchoolOption = { key: string; label: string }

function EscuelaFilter({
  schools,
  value,
  onChange,
}: {
  schools: SchoolOption[]
  value: string | null
  onChange: (key: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const visibleSchools = useMemo(() => {
    const q = normalize(query)
    return q ? schools.filter((s) => normalize(s.label).includes(q)) : schools
  }, [schools, query])

  const selected = schools.find((s) => s.key === value)

  function pick(key: string | null) {
    onChange(key)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <SchoolIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="max-w-[140px] truncate text-sm">
          {selected ? selected.label : "Escuela"}
        </span>
        {value && (
          <span
            className="ml-1 flex items-center"
            onClick={(e) => { e.stopPropagation(); pick(null) }}
          >
            <XIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b">
            <Input
              autoFocus
              className="h-8 text-sm"
              placeholder="Buscar escuela..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {visibleSchools.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              visibleSchools.map((s) => (
                <button
                  key={s.key}
                  className={[
                    "w-full px-3 py-1.5 text-left text-sm transition-colors flex items-center gap-2",
                    value === s.key ? "bg-muted font-medium" : "hover:bg-muted/50",
                  ].join(" ")}
                  onClick={() => pick(s.key)}
                >
                  {value === s.key
                    ? <CheckIcon className="size-3.5 shrink-0" />
                    : <span className="size-3.5 shrink-0" />
                  }
                  {s.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export function AsistentesTable({ data }: Props) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<TabValue>("todos")
  const [page, setPage] = useState(1)
  const [escuelaFilter, setEscuelaFilter] = useState<string | null>(null)
  const [selectedAsistente, setSelectedAsistente] = useState<Asistente | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isEscuelasTab = tab === "esc-queretaro" || tab === "esc-morelia"

  const queretaroData = useMemo(() => data.filter(isQueretaro), [data])
  const moreliaData   = useMemo(() => data.filter(isMorelia),   [data])

  const tabCounts = useMemo<Record<TabValue, number>>(() => ({
    todos:          data.length,
    queretaro:      queretaroData.length,
    morelia:        moreliaData.length,
    "esc-queretaro": groupByEscuela(queretaroData).length,
    "esc-morelia":   groupByEscuela(moreliaData).length,
  }), [data, queretaroData, moreliaData])

  const escuelasRows = useMemo<EscuelaRow[]>(() => {
    if (tab === "esc-queretaro") return groupByEscuela(queretaroData)
    if (tab === "esc-morelia")   return groupByEscuela(moreliaData)
    return []
  }, [tab, queretaroData, moreliaData])

  const schoolOptions = useMemo<SchoolOption[]>(() => {
    const base = data.filter((a) => matchesTab(a, tab))
    const seen = new Map<string, string>()
    for (const a of base) {
      const raw = a.escuela?.trim() ?? ""
      if (!raw) continue
      const key = normalize(raw)
      if (!seen.has(key)) seen.set(key, toTitleCase(raw))
    }
    return Array.from(seen.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
  }, [data, tab])

  const filtered = useMemo(() => {
    let result = data.filter((a) => matchesTab(a, tab))
    if (escuelaFilter) result = result.filter((a) => normalize(a.escuela?.trim() ?? "") === escuelaFilter)
    if (search.trim()) result = result.filter((a) => matchesSearch(a, search))
    return result
  }, [data, tab, search, escuelaFilter])

  const asistenciaStats = useMemo(() => ({
    asistio:   filtered.filter((a) => a.asistio === true).length,
    noAsistio: filtered.filter((a) => a.asistio === false).length,
  }), [filtered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageWindow = buildPageWindow(safePage, totalPages)

  function changeTab(v: TabValue) { setTab(v); setPage(1); setSearch(""); setEscuelaFilter(null) }

  function handleEdit(asistente: Asistente) {
    setSelectedAsistente(asistente)
    setIsDialogOpen(true)
  }

  function handleDialogClose(open: boolean) {
    setIsDialogOpen(open)
    if (!open) setSelectedAsistente(undefined)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => changeTab(v as TabValue)}>
          <TabsList>
            {(Object.keys(TAB_LABELS) as TabValue[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                <span className="hidden sm:inline">{TAB_LABELS[key]}</span>
                <span className="sm:hidden">{TAB_LABELS_SHORT[key]}</span>
                <span className="ml-1.5 rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-xs tabular-nums">
                  {tabCounts[key]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {!isEscuelasTab && (
          <AsistenteTriggerButton
            onOpenChange={() => { setSelectedAsistente(undefined); setIsDialogOpen(true) }}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder={isEscuelasTab ? "Buscar escuela..." : "Buscar..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        {!isEscuelasTab && (
          <>
            <EscuelaFilter
              schools={schoolOptions}
              value={escuelaFilter}
              onChange={(k) => { setEscuelaFilter(k); setPage(1) }}
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                <CheckIcon className="size-3" />
                {asistenciaStats.asistio}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                <XIcon className="size-3" />
                {asistenciaStats.noAsistio}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Vista escuelas */}
      {isEscuelasTab && (
        <>
          <EscuelasView rows={escuelasRows} search={search} />
          <p className="text-sm text-muted-foreground">
            {escuelasRows.length} escuela{escuelasRows.length !== 1 ? "s" : ""} registrada{escuelasRows.length !== 1 ? "s" : ""}
          </p>
        </>
      )}

      {/* Vista asistentes — tabla desktop */}
      {!isEscuelasTab && (
        <>
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-3">#</TableHead>
                  <TableHead className="px-3">Nombre</TableHead>
                  <TableHead className="px-3">Escuela</TableHead>
                  <TableHead className="px-3">Cargo</TableHead>
                  <TableHead className="px-3">Correo</TableHead>
                  <TableHead className="px-3">WhatsApp</TableHead>
                  <TableHead className="px-3">Asistencia</TableHead>
                  <TableHead className="w-10 px-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-sm text-muted-foreground">
                      {search ? "Sin resultados." : "No hay asistentes en esta categoría."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((asistente) => (
                    <TableRow key={asistente.id}>
                      <TableCell className="px-3 text-sm text-muted-foreground">{asistente.id}</TableCell>
                      <TableCell className="px-3 text-sm font-medium whitespace-nowrap">
                        {[asistente.nombre, asistente.apellido].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell className="px-3 text-sm max-w-[200px] truncate">{asistente.escuela ?? "—"}</TableCell>
                      <TableCell className="px-3 text-sm whitespace-nowrap">{asistente.cargo ?? "—"}</TableCell>
                      <TableCell className="px-3 text-sm">{asistente.correo ?? "—"}</TableCell>
                      <TableCell className="px-3 text-sm whitespace-nowrap">{asistente.whatsApp ?? "—"}</TableCell>
                      <TableCell className="px-3">
                        <AsistenciaButton asistente={asistente} />
                      </TableCell>
                      <TableCell className="px-3">
                        <AsistenteTriggerButton
                          asistente={asistente}
                          onOpenChange={() => handleEdit(asistente)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Cards móvil */}
          <div className="md:hidden space-y-3">
            {paginated.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">
                {search ? "Sin resultados." : "No hay asistentes en esta categoría."}
              </p>
            ) : (
              paginated.map((asistente) => (
                <AsistenteCard
                  key={asistente.id}
                  asistente={asistente}
                  onEdit={() => handleEdit(asistente)}
                />
              ))
            )}
          </div>

          {/* Footer paginador */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              {filtered.length === 0
                ? "Sin resultados"
                : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} de ${filtered.length} asistente${filtered.length !== 1 ? "s" : ""}`}
            </p>

            {totalPages > 1 && (
              <Pagination className="order-1 sm:order-2 w-auto mx-0 justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text="Anterior"
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}
                      aria-disabled={safePage === 1}
                      className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {pageWindow.map((p, i) =>
                    p === "..." ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === safePage}
                          onClick={(e) => { e.preventDefault(); setPage(p) }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      text="Siguiente"
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}
                      aria-disabled={safePage === totalPages}
                      className={safePage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </>
      )}

      <AsistenteDialog
        asistente={selectedAsistente}
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
      />
    </div>
  )
}
