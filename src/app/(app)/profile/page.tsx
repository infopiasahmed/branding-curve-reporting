"use client"

import Link from "next/link"
import { ChevronRight, LogOut } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { useAgency } from "@/components/providers/agency-provider"
import { assignmentsForUser, reportingProgress } from "@/lib/data/selectors"
import { displayName } from "@/types/domain"

export default function ProfilePage() {
  const { user, state, signOut, demoMode } = useAgency()
  if (!user) return <ScreenSkeleton />
  const assigned = assignmentsForUser(state, user.id)
  const progress = reportingProgress(state, user)
  const historyCount = state.reports.filter((report) => report.userId === user.id).length

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="px-4 pb-8">
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
          <UserAvatar profile={user} className="size-16 text-lg" />
          <div>
            <p className="text-xl font-semibold">{displayName(user)}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{user.role}</p>
          </div>
        </div>

        {user.role === "marketer" ? (
          <div className="mb-4 rounded-2xl border border-border bg-white p-4">
            <p className="text-sm text-muted-foreground">Today&apos;s reporting</p>
            <p className="text-lg font-semibold">
              {progress.completed} / {progress.total} completed
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <Row label="Assigned Clients" value={String(user.role === "admin" ? state.clients.length : assigned.length)} />
          <Row label="Report History" value={String(historyCount)} />
          {user.role === "admin" ? (
            <>
              <Link href="/team" className="flex min-h-14 items-center justify-between border-t border-border px-4">
                <span>Team</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              <Link href="/clients/new" className="flex min-h-14 items-center justify-between border-t border-border px-4">
                <span>Create Client</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </>
          ) : null}
        </div>

        {demoMode ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Running in demo mode until Supabase is connected.
          </p>
        ) : null}

        <Button variant="outline" size="xl" className="mt-6 w-full" onClick={() => signOut()}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between px-4">
      <span>{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  )
}
