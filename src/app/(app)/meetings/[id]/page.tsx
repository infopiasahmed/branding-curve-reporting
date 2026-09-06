"use client"

import { use, useState } from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { VoiceButton } from "@/components/voice-button"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAgency } from "@/components/providers/agency-provider"
import { formatTime, groupLabel } from "@/lib/dates"
import { displayName, type MeetingActionItem } from "@/types/domain"

export default function MeetingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, state, saveMeeting, toggleActionItem, replaceActionItems } = useAgency()
  const meeting = state.meetings.find((item) => item.id === id)
  const [notes, setNotes] = useState(meeting?.notes ?? "")
  const [newItem, setNewItem] = useState("")
  if (!user) return <ScreenSkeleton />
  if (!meeting) {
    return (
      <div>
        <PageHeader title="Meeting" backHref="/meetings" />
        <div className="px-4">
          <EmptyState title="Meeting not found" />
        </div>
      </div>
    )
  }

  const current = meeting
  const client = state.clients.find((item) => item.id === current.clientId)
  const participants = current.participantIds
    .map((pid) => state.profiles.find((profile) => profile.id === pid))
    .filter(Boolean)

  async function saveNotes() {
    await saveMeeting({
      id: current.id,
      clientId: current.clientId,
      createdBy: current.createdBy,
      title: current.title,
      meetingDate: current.meetingDate,
      meetingTime: current.meetingTime,
      meetingType: current.meetingType,
      participantIds: current.participantIds,
      actionItems: current.actionItems,
      notes,
    })
    toast.success("Notes saved")
  }

  function addAction() {
    if (!newItem.trim()) return
    const item: MeetingActionItem = {
      id: crypto.randomUUID(),
      meetingId: current.id,
      content: newItem.trim(),
      completed: false,
      sortOrder: current.actionItems.length,
    }
    replaceActionItems(current.id, [...current.actionItems, item])
    setNewItem("")
  }

  return (
    <div>
      <PageHeader title={meeting.title} backHref="/meetings" />
      <div className="space-y-6 px-4 pb-8">
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">
            {groupLabel(meeting.meetingDate)} · {formatTime(meeting.meetingTime)}
          </p>
          <p className="mt-1 text-lg font-semibold">{client?.name}</p>
          <p className="text-sm capitalize text-muted-foreground">{meeting.meetingType} meeting</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {participants.map((profile) => displayName(profile!)).join(", ")}
          </p>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Meeting Notes</h2>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-32 rounded-2xl bg-white"
            placeholder="What was discussed?"
          />
          <div className="mt-2">
            <VoiceButton value={notes} onChange={setNotes} />
          </div>
          <Button className="mt-3 w-full" size="xl" onClick={saveNotes}>
            Save notes
          </Button>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Action Items</h2>
          <div className="space-y-2 rounded-2xl border border-border bg-white p-3">
            {meeting.actionItems.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">No action items yet.</p>
            ) : (
              meeting.actionItems.map((item) => (
                <label key={item.id} className="flex min-h-11 items-start gap-3 py-1">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleActionItem(meeting.id, item.id)}
                  />
                  <span className={item.completed ? "text-muted-foreground line-through" : ""}>
                    {item.content}
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              placeholder="Add an action item"
              className="h-12 rounded-xl bg-white"
            />
            <Button type="button" size="xl" onClick={addAction}>
              Add
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
