import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchClients } from "@/lib/data/clients"
import { mapActivity } from "@/lib/data/mappers"
import { fetchMeetings } from "@/lib/data/meetings"
import { fetchReports } from "@/lib/data/reports"
import { fetchActivities, fetchAssignments, fetchOwnProfile, fetchProfiles } from "@/lib/data/team"
import type { AgencyState, Profile } from "@/types/domain"

export async function loadAgencyState(
  client: SupabaseClient,
  userId: string
): Promise<{ user: Profile; state: AgencyState }> {
  const own = await fetchOwnProfile(client, userId)
  if (!own) throw new Error("Your profile was not found. Ask an admin to set up your account.")
  if (!own.isActive) throw new Error("This account is inactive.")

  const [profiles, clients, assignments, reports, meetings, activityRows] = await Promise.all([
    fetchProfiles(client),
    fetchClients(client),
    fetchAssignments(client),
    fetchReports(client),
    fetchMeetings(client),
    fetchActivities(client),
  ])

  const mergedProfiles = profiles.some((profile) => profile.id === own.id)
    ? profiles
    : [own, ...profiles]

  return {
    user: own,
    state: {
      profiles: mergedProfiles,
      clients,
      assignments,
      reports,
      meetings,
      activities: activityRows.map((row) => mapActivity(row as never)),
    },
  }
}
