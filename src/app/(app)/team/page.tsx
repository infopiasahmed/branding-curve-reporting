"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { loadTeamRosterAction, type TeamRosterMember } from "@/app/actions/team-admin"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAgency } from "@/components/providers/agency-provider"
import { TeamMarketerCard } from "@/app/(app)/team/team-marketer-card"
import { assignmentsForUser, reportingProgress } from "@/lib/data/selectors"

export default function TeamPage() {
  const { user, state, inviteMarketer, refresh, demoMode } = useAgency()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [roster, setRoster] = useState<TeamRosterMember[]>([])

  const reloadRoster = useCallback(async () => {
    if (demoMode) {
      setRoster([])
      return
    }
    const result = await loadTeamRosterAction()
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setRoster(result.members)
  }, [demoMode])

  useEffect(() => {
    if (!user || user.role !== "admin") return
    let cancelled = false
    void (async () => {
      if (demoMode) return
      const result = await loadTeamRosterAction()
      if (cancelled) return
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setRoster(result.members)
    })()
    return () => {
      cancelled = true
    }
  }, [demoMode, user])

  if (!user) return <ScreenSkeleton />
  if (user.role !== "admin") {
    return (
      <div>
        <PageHeader title="Team" backHref="/profile" />
        <div className="px-4">
          <EmptyState title="Admin only" description="Only admins can view the team." />
        </div>
      </div>
    )
  }

  const marketers = state.profiles.filter((profile) => profile.role === "marketer")
  const rosterById = new Map(roster.map((member) => [member.id, member]))

  async function onInvite(event: FormEvent) {
    event.preventDefault()
    try {
      await inviteMarketer({ firstName, lastName, email })
      setFirstName("")
      setLastName("")
      setEmail("")
      setOpen(false)
      await reloadRoster()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite marketer")
    }
  }

  async function onRosterChanged() {
    await refresh()
    await reloadRoster()
  }

  return (
    <div>
      <PageHeader
        title="Team"
        backHref="/profile"
        action={
          <Button onClick={() => setOpen((value) => !value)}>Invite</Button>
        }
      />
      <div className="space-y-3 px-4 pb-8">
        {open ? (
          <form onSubmit={onInvite} className="space-y-3 rounded-2xl border border-border bg-white p-4">
            <Input className="h-12 rounded-xl" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input className="h-12 rounded-xl" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input className="h-12 rounded-xl" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" size="xl" className="w-full">Add marketer</Button>
          </form>
        ) : null}
        {marketers.map((marketer) => {
          const progress = reportingProgress(state, marketer)
          const assigned = assignmentsForUser(state, marketer.id)
          return (
            <TeamMarketerCard
              key={marketer.id}
              profile={marketer}
              member={rosterById.get(marketer.id) ?? null}
              completed={progress.completed}
              total={progress.total}
              assignedCount={assigned.length}
              onChanged={onRosterChanged}
            />
          )
        })}
      </div>
    </div>
  )
}
