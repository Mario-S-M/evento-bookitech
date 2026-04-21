import { getAllAsistentes } from "@/lib/repositories/asistente"
import { AsistentesTable } from "@/components/dashboard/asistentes-table"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard · Asistentes",
}

export default async function DashboardPage() {
  const asistentes = await getAllAsistentes()

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Asistentes al evento</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona el registro de asistentes, sus datos y talleres de interés.
        </p>
      </div>

      <AsistentesTable data={asistentes} />
    </main>
  )
}
