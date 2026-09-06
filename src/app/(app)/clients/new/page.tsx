"use client"

import { ClientForm } from "@/components/client-form"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { useAgency } from "@/components/providers/agency-provider"

export default function NewClientPage() {
  const { user } = useAgency()
  if (!user) return <ScreenSkeleton />
  if (user.role !== "admin") {
    return (
      <div>
        <PageHeader title="Create Client" backHref="/clients" />
        <div className="px-4">
          <EmptyState title="Admin only" />
        </div>
      </div>
    )
  }
  return <ClientForm title="Create Client" backHref="/clients" />
}
