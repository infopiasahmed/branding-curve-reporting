"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import { ClientMark } from "@/components/user-avatar"
import { useAgency } from "@/components/providers/agency-provider"
import { todayISO } from "@/lib/dates"
import { clientsForUser, todayReport } from "@/lib/data/selectors"

export default function ClientsPage() {
  const { user, state } = useAgency()
  const [query, setQuery] = useState("")
  const clients = useMemo(() => {
    if (!user) return []
    const list = clientsForUser(state, user)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        client.category?.toLowerCase().includes(q)
    )
  }, [query, state, user])
  if (!user) return <ScreenSkeleton />

  return (
    <div>
      <PageHeader
        title="Clients"
        action={
          user.role === "admin" ? (
            <Link href="/clients/new" className={buttonVariants({ size: "icon-lg" })} aria-label="Create client">
              <Plus className="size-5" />
            </Link>
          ) : null
        }
      />
      <div className="px-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients"
            className="h-12 rounded-xl bg-white pl-9"
          />
        </div>
        {clients.length === 0 ? (
          <EmptyState title="No clients found" description="Assigned clients will appear here." />
        ) : (
          <div className="space-y-2">
            {clients.map((client) => {
              const reported =
                user.role === "admin"
                  ? Boolean(
                      state.reports.find(
                        (report) =>
                          report.clientId === client.id && report.reportDate === todayISO()
                      )
                    )
                  : Boolean(todayReport(state, user.id, client.id))
              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3"
                >
                  <ClientMark name={client.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{client.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {client.category || "Client"}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      reported ? "text-[var(--success)]" : "text-[oklch(0.55_0.14_55)]"
                    }`}
                  >
                    {reported ? "✓ Reported today" : "● Report pending"}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
