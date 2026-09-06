import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
  className,
}: {
  title: string
  subtitle?: string
  backHref?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("sticky top-0 z-20 bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md", className)}>
      <div className="flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:bg-white"
            aria-label="Back"
          >
            <ChevronLeft className="size-6" />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
    </header>
  )
}
