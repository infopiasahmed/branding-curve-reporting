"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { VoiceButton } from "@/components/voice-button"
import { buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAgency } from "@/components/providers/agency-provider"
import { clientsForUser, todayReport } from "@/lib/data/selectors"
import { todayISO } from "@/lib/dates"
import { REPORT_TAGS, TAG_LABELS, type ReportTag } from "@/types/domain"

export default function ReportForm() {
  const { user, state, saveReport } = useAgency()
  const params = useSearchParams()
  const router = useRouter()
  const preselected = params.get("client") ?? ""
  const [clientId, setClientId] = useState(preselected)
  const [content, setContent] = useState("")
  const [tomorrowPlan, setTomorrowPlan] = useState("")
  const [showPlan, setShowPlan] = useState(false)
  const [tags, setTags] = useState<ReportTag[]>([])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [seededKey, setSeededKey] = useState("")

  const resolvedClientId = preselected || clientId
  if (preselected && clientId !== preselected) {
    setClientId(preselected)
  }

  const existing = user && resolvedClientId ? todayReport(state, user.id, resolvedClientId) : undefined
  const seedKey = existing?.id ?? `new-${resolvedClientId}`
  if (existing && !dirty && seededKey !== seedKey) {
    setSeededKey(seedKey)
    setContent(existing.content)
    setTomorrowPlan(existing.tomorrowPlan ?? "")
    setTags(existing.tags)
    setShowPlan(Boolean(existing.tomorrowPlan))
  }

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (dirty && content.trim()) event.preventDefault()
    }
    window.addEventListener("beforeunload", onLeave)
    return () => window.removeEventListener("beforeunload", onLeave)
  }, [content, dirty])

  if (!user) return <ScreenSkeleton />
  const clients = clientsForUser(state, user)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!clientId) {
      toast.error("Select a client")
      return
    }
    if (!content.trim()) {
      toast.error("Write or speak today's update before saving")
      return
    }
    setSaving(true)
    try {
      await saveReport({
        id: existing?.id,
        clientId,
        reportDate: todayISO(),
        content: content.trim(),
        tomorrowPlan: tomorrowPlan.trim() || undefined,
        tags,
      })
      setDirty(false)
      toast.success("Report saved")
      router.push(preselected ? `/clients/${clientId}` : "/home")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save report")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <PageHeader title={existing ? "Edit Report" : "New Report"} />
      <div className="flex-1 space-y-5 px-4 pb-28">
        <div>
          <Label className="mb-2 block">Select Client</Label>
          <select
            value={clientId}
            onChange={(event) => {
              setDirty(false)
              setSeededKey("")
              setClientId(event.target.value)
            }}
            className="h-12 w-full rounded-xl border border-input bg-white px-3 text-base"
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-muted-foreground">Today</p>
        </div>
        <div>
          <Label htmlFor="content" className="mb-2 block">
            What&apos;s happening with this client today?
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(event) => {
              setDirty(true)
              setContent(event.target.value)
            }}
            className="min-h-44 rounded-2xl bg-white px-3.5 py-3 text-base leading-6"
          />
        </div>
        <VoiceButton
          value={content}
          onChange={(text) => {
            setDirty(true)
            setContent(text)
          }}
        />
        <div>
          <p className="mb-2 text-sm font-medium">Tags</p>
          <div className="flex flex-wrap gap-2">
            {REPORT_TAGS.map((tag) => {
              const selected = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setTags((current) =>
                      selected ? current.filter((item) => item !== tag) : [...current, tag]
                    )
                  }
                  className={`rounded-full px-3 py-2 text-sm ${
                    selected ? "bg-primary text-primary-foreground" : "bg-white text-foreground ring-1 ring-border"
                  }`}
                >
                  {TAG_LABELS[tag]}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <button
            type="button"
            className="text-sm font-medium text-muted-foreground"
            onClick={() => setShowPlan((value) => !value)}
          >
            {showPlan ? "Hide tomorrow's plan" : "Add tomorrow's plan"}
          </button>
          {showPlan ? (
            <Textarea
              value={tomorrowPlan}
              onChange={(event) => {
                setDirty(true)
                setTomorrowPlan(event.target.value)
              }}
              className="mt-2 min-h-24 rounded-2xl bg-white"
              placeholder="What will you do tomorrow?"
            />
          ) : null}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-20 z-20 mx-auto w-full max-w-[430px] bg-gradient-to-t from-background via-background to-transparent px-4 pb-2 pt-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSubmit({ preventDefault() {} } as FormEvent)}
          className={buttonVariants({ size: "xl", className: "w-full" })}
        >
          {saving ? "Saving..." : "Save Report"}
        </button>
      </div>
    </form>
  )
}
