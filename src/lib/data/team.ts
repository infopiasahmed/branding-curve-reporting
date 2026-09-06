import type { SupabaseClient } from "@supabase/supabase-js"
import { explainSupabaseError, mapProfile, type ProfileRow } from "@/lib/data/mappers"
import type { ClientAssignment } from "@/types/domain"

export async function fetchProfiles(client: SupabaseClient) {
  const { data, error } = await client.from("profiles").select("*").order("first_name")
  if (error) throw new Error(explainSupabaseError(error))
  return ((data ?? []) as ProfileRow[]).map(mapProfile)
}

export async function fetchOwnProfile(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle()
  if (error) throw new Error(explainSupabaseError(error))
  return data ? mapProfile(data as ProfileRow) : null
}

export async function fetchAssignments(client: SupabaseClient): Promise<ClientAssignment[]> {
  const { data, error } = await client.from("client_assignments").select("client_id, user_id")
  if (error) throw new Error(explainSupabaseError(error))
  return (data ?? []).map((row) => ({
    clientId: row.client_id as string,
    userId: row.user_id as string,
  }))
}

export async function setUserAssignments(
  client: SupabaseClient,
  userId: string,
  clientIds: string[]
) {
  const uniqueIds = Array.from(new Set(clientIds))
  const { data: current, error: readError } = await client
    .from("client_assignments")
    .select("client_id")
    .eq("user_id", userId)
  if (readError) throw new Error(explainSupabaseError(readError))
  const existing = new Set((current ?? []).map((row) => row.client_id as string))
  const next = new Set(uniqueIds)
  const toRemove = [...existing].filter((id) => !next.has(id))
  const toAdd = [...next].filter((id) => !existing.has(id))

  if (toRemove.length > 0) {
    const { error } = await client
      .from("client_assignments")
      .delete()
      .eq("user_id", userId)
      .in("client_id", toRemove)
    if (error) throw new Error(explainSupabaseError(error))
  }
  if (toAdd.length > 0) {
    const { error } = await client.from("client_assignments").upsert(
      toAdd.map((clientId) => ({ client_id: clientId, user_id: userId })),
      { onConflict: "client_id,user_id", ignoreDuplicates: true }
    )
    if (error) throw new Error(explainSupabaseError(error))
  }
}

export async function fetchActivities(client: SupabaseClient) {
  const { data, error } = await client
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80)
  if (error) throw new Error(explainSupabaseError(error))
  return data ?? []
}
