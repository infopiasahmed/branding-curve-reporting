"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAgency } from "@/components/providers/agency-provider"
import type { Client, ClientStatus } from "@/types/domain"

export function ClientForm({
  title,
  backHref,
  initial,
}: {
  title: string
  backHref: string
  initial?: Client
}) {
  const { user, saveClient } = useAgency()
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? "")
  const [category, setCategory] = useState(initial?.category ?? "")
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "")
  const [status, setStatus] = useState<ClientStatus>(initial?.status ?? "active")
  const [saving, setSaving] = useState(false)

  if (!user) return <ScreenSkeleton />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const client = await saveClient({
        id: initial?.id ?? crypto.randomUUID(),
        name: name.trim(),
        category: category.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        status,
      })
      toast.success(initial ? "Client updated" : "Client created")
      router.push(`/clients/${client.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save client")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader title={title} backHref={backHref} />
      <div className="space-y-4 px-4 pb-8">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input className="h-12 rounded-xl bg-white" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Business category</Label>
          <Input className="h-12 rounded-xl bg-white" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Contact person</Label>
          <Input className="h-12 rounded-xl bg-white" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["active", "archived"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`h-12 rounded-xl capitalize ${
                  status === item ? "bg-foreground text-background" : "bg-white ring-1 ring-border"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" size="xl" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Client"}
        </Button>
      </div>
    </form>
  )
}
