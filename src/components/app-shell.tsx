"use client"

import { BottomNav } from "@/components/bottom-nav"
import { useAgency } from "@/components/providers/agency-provider"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { cn } from "@/lib/utils"

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { ready, user } = useAgency()
  const showApp = ready && Boolean(user)

  return (
    <div className="min-h-dvh bg-neutral-200/70">
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background shadow-[0_0_40px_rgba(20,16,12,0.06)]",
          className
        )}
      >
        <div className="flex-1 pb-24">{showApp ? children : <ScreenSkeleton />}</div>
        {showApp ? <BottomNav /> : null}
      </div>
    </div>
  )
}
