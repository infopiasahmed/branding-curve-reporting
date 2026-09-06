"use client"

import { use } from "react"
import { ClientForm } from "@/components/client-form"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { useAgency } from "@/components/providers/agency-provider"

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, state } = useAgency()
  const client = state.clients.find((item) => item.id === id)
  if (!user) return <ScreenSkeleton />
  if (user.role !== "admin" || !client) {
    return (
      <div>
        <PageHeader title="Edit Client" backHref="/clients" />
        <div className="px-4">
          <EmptyState title="Not available" />
        </div>
      </div>
    )
  }
  return <ClientForm title="Edit Client" backHref={`/clients/${client.id}`} initial={client} />
}
