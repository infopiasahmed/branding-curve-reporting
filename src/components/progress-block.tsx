export function ProgressBlock({
  label,
  completed,
  total,
}: {
  label: string
  completed: number
  total: number
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(20,16,12,0.04)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
        <p className="text-sm font-semibold">
          {completed} of {total} completed
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  )
}
