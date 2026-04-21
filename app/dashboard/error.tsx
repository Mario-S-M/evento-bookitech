"use client"

type Props = {
  error: Error & { digest?: string }
}

export default function DashboardError({ error }: Props) {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
        <p className="font-semibold text-destructive">Error al cargar el dashboard</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">digest: {error.digest}</p>
        )}
      </div>
    </main>
  )
}
