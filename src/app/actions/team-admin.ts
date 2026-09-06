"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import { requireActiveAdmin } from "@/lib/auth/require-active-admin"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

export type TeamMemberStatus = "pending" | "active" | "inactive"

export type TeamRosterMember = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "marketer"
  isActive: boolean
  status: TeamMemberStatus
  invitedAt: string | null
  acceptedAt: string | null
}

type ProfileRosterRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

const SERVICE_MISSING =
  "Team management is not configured on the server. Add SUPABASE_SERVICE_ROLE_KEY to the server environment and restart the app."
const ALREADY_ACCEPTED =
  "This invitation has already been accepted. Remove the marketer instead."
const HAS_HISTORY =
  "This account has reports or meetings, so the invitation cannot be cancelled. Remove the marketer instead."
const NOT_PENDING = "This invitation is no longer pending."
const NOT_ACTIVE = "This marketer has not accepted the invitation yet. Cancel the invitation instead."
const NOT_MARKETER = "Only marketers can be managed from Team."

function publicActionError() {
  return "Could not complete that team action. Try again."
}

function deriveStatus(isActive: boolean, emailConfirmedAt: string | null): TeamMemberStatus {
  if (!isActive) return "inactive"
  if (!emailConfirmedAt) return "pending"
  return "active"
}

function isoOrNull(value: string | null | undefined) {
  return value ? value : null
}

async function loadMarketerProfile(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, role, is_active, created_at")
    .eq("id", profileId)
    .maybeSingle()

  if (error || !data) return null
  return data as ProfileRosterRow
}

async function countOwnedHistory(profileId: string) {
  const admin = createSupabaseServiceClient()
  if (!admin) return { ok: false as const, message: SERVICE_MISSING }

  const [reports, meetings] = await Promise.all([
    admin.from("daily_reports").select("id", { count: "exact", head: true }).eq("user_id", profileId),
    admin.from("meetings").select("id", { count: "exact", head: true }).eq("created_by", profileId),
  ])

  if (reports.error || meetings.error) {
    return { ok: false as const, message: publicActionError() }
  }

  return {
    ok: true as const,
    reports: reports.count ?? 0,
    meetings: meetings.count ?? 0,
  }
}

export async function loadTeamRosterAction() {
  const authz = await requireActiveAdmin()
  if (!authz.ok) return authz

  const { data, error } = await authz.supabase
    .from("profiles")
    .select("id, first_name, last_name, email, role, is_active, created_at")
    .eq("role", "marketer")
    .order("first_name")

  if (error) {
    return { ok: false as const, message: publicActionError() }
  }

  const admin = createSupabaseServiceClient()
  if (!admin) {
    return { ok: false as const, message: SERVICE_MISSING }
  }

  const rows = (data ?? []) as ProfileRosterRow[]
  const members: TeamRosterMember[] = await Promise.all(
    rows.map(async (row) => {
      const { data: authData } = await admin.auth.admin.getUserById(row.id)
      const authUser = authData?.user
      const emailConfirmedAt = isoOrNull(authUser?.email_confirmed_at)
      const invitedAt =
        isoOrNull(authUser?.invited_at) ??
        isoOrNull(authUser?.confirmation_sent_at) ??
        isoOrNull(row.created_at)

      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role: "marketer" as const,
        isActive: row.is_active,
        status: authUser
          ? deriveStatus(row.is_active, emailConfirmedAt)
          : row.is_active
            ? "active"
            : "inactive",
        invitedAt,
        acceptedAt: emailConfirmedAt,
      }
    })
  )

  return { ok: true as const, members }
}

export async function cancelMarketerInvitation(profileId: string) {
  const authz = await requireActiveAdmin()
  if (!authz.ok) return authz

  const profile = await loadMarketerProfile(authz.supabase, profileId)
  if (!profile) {
    return { ok: false as const, message: publicActionError() }
  }
  if (profile.role !== "marketer") {
    return { ok: false as const, message: NOT_MARKETER }
  }
  if (profile.is_active !== true) {
    return { ok: false as const, message: NOT_PENDING }
  }

  const admin = createSupabaseServiceClient()
  if (!admin) {
    return { ok: false as const, message: SERVICE_MISSING }
  }

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(profile.id)
  if (authError || !authData?.user) {
    return { ok: false as const, message: publicActionError() }
  }
  if (authData.user.email_confirmed_at) {
    return { ok: false as const, message: ALREADY_ACCEPTED }
  }

  const history = await countOwnedHistory(profile.id)
  if (!history.ok) return history
  if (history.reports > 0 || history.meetings > 0) {
    return { ok: false as const, message: HAS_HISTORY }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id)
  if (deleteError) {
    return { ok: false as const, message: publicActionError() }
  }

  return { ok: true as const }
}

export async function deactivateMarketer(profileId: string) {
  const authz = await requireActiveAdmin()
  if (!authz.ok) return authz

  const profile = await loadMarketerProfile(authz.supabase, profileId)
  if (!profile) {
    return { ok: false as const, message: publicActionError() }
  }
  if (profile.role !== "marketer") {
    return { ok: false as const, message: NOT_MARKETER }
  }

  const admin = createSupabaseServiceClient()
  if (!admin) {
    return { ok: false as const, message: SERVICE_MISSING }
  }

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(profile.id)
  if (authError || !authData?.user) {
    return { ok: false as const, message: publicActionError() }
  }
  if (!authData.user.email_confirmed_at) {
    return { ok: false as const, message: NOT_ACTIVE }
  }

  if (profile.is_active === true) {
    const { error: updateError } = await authz.supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", profile.id)
      .eq("role", "marketer")

    if (updateError) {
      return { ok: false as const, message: publicActionError() }
    }
  }

  const { error: assignmentError } = await authz.supabase
    .from("client_assignments")
    .delete()
    .eq("user_id", profile.id)

  if (assignmentError) {
    return { ok: false as const, message: publicActionError() }
  }

  return { ok: true as const }
}
