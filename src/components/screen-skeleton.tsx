import { Skeleton } from "@/components/ui/skeleton"

export function ScreenSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  )
}
