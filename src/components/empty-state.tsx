import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border bg-white/60 px-5 py-10 text-center", className)}>
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-[240px] text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
