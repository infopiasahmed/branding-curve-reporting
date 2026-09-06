import type { SupabaseClient } from "@supabase/supabase-js"
import { explainSupabaseError, mapClient, type ClientRow } from "@/lib/data/mappers"
import type { Client } from "@/types/domain"

export async function fetchClients(client: SupabaseClient) {
  const { data, error } = await client
    .from("clients")
    .select("*")
    .order("name")
  if (error) throw new Error(explainSupabaseError(error))
  return ((data ?? []) as ClientRow[]).map(mapClient)
}

export async function saveClientRecord(
  client: SupabaseClient,
  input: Omit<Client, "createdAt" | "updatedAt">
) {
  const payload = {
    id: input.id,
    name: input.name,
    logo_url: input.logoUrl ?? null,
    category: input.category ?? null,
    contact_person: input.contactPerson ?? null,
    status: input.status,
  }
  const { data, error } = await client.from("clients").upsert(payload).select("*").single()
  if (error) throw new Error(explainSupabaseError(error))
  return mapClient(data as ClientRow)
}
