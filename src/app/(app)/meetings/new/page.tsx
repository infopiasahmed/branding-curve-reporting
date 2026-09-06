"use client"

import { FormEvent, Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAgency } from "@/components/providers/agency-provider"
import { clientsForUser } from "@/lib/data/selectors"
import { todayISO } from "@/lib/dates"
import type { MeetingType } from "@/types/domain"

function NewMeetingForm() {
  const { user, state, saveMeeting } = useAgency()
  const params = useSearchParams()
  const router = useRouter()
  const [clientId, setClientId] = useState(params.get("client") ?? "")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState("16:00")
  const [type, setType] = useState<MeetingType>("client")
  const [participantIds, setParticipantIds] = useState<string[]>(user ? [user.id] : [])
  const [saving, setSaving] = useState(false)
  if (user && participantIds.length === 0) {
    setParticipantIds([user.id])
  }

  if (!user) return <ScreenSkeleton />
  const clients = clientsForUser(state, user)
  const marketers = state.profiles.filter((profile) => profile.role === "marketer" || profile.id === user.id)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!clientId || !title.trim()) {
      toast.error("Client and title are required")
      return
    }
    setSaving(true)
    try {
      if (!user) return
      const meeting = await saveMeeting({
        clientId,
        title: title.trim(),
        meetingDate: date,
        meetingTime: time,
        meetingType: type,
        participantIds: participantIds.length ? participantIds : [user.id],
      })
      toast.success("Meeting saved")
      router.push(`/meetings/${meeting.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save meeting")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader title="Add Meeting" backHref="/meetings" />
      <div className="space-y-4 px-4 pb-8">
        <Field label="Client">
          <select
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-white px-3"
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Meeting title / purpose">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-12 rounded-xl bg-white"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-12 rounded-xl bg-white" />
          </Field>
          <Field label="Time">
            <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="h-12 rounded-xl bg-white" />
          </Field>
        </div>
        <Field label="Meeting type">
          <div className="grid grid-cols-2 gap-2">
            {(["client", "internal"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setType(item)}
                className={`h-12 rounded-xl capitalize ${
                  type === item ? "bg-primary text-primary-foreground" : "bg-white ring-1 ring-border"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Participants (optional)">
          <div className="space-y-2 rounded-2xl border border-border bg-white p-3">
            {marketers.map((profile) => (
              <label key={profile.id} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={participantIds.includes(profile.id)}
                  onChange={(event) => {
                    setParticipantIds((current) =>
                      event.target.checked
                        ? [...current, profile.id]
                        : current.filter((id) => id !== profile.id)
                    )
                  }}
                />
                <span>
                  {profile.firstName} {profile.lastName}
                </span>
              </label>
            ))}
          </div>
        </Field>
        <Button type="submit" size="xl" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Meeting"}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export default function NewMeetingPage() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <NewMeetingForm />
    </Suspense>
  )
}
