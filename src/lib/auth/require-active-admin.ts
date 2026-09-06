import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export const ADMIN_UNAUTHORIZED = "You are not allowed to manage the team."

export async function requireActiveAdmin(unauthorized = ADMIN_UNAUTHORIZED) {
  const supabase = await createSupabaseServerClient()
  if (!supabase) {
    return { ok: false as const, message: "The database is not connected." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, message: unauthorized }
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle()

  if (
    error ||
    !profile ||
    profile.id !== user.id ||
    profile.role !== "admin" ||
    profile.is_active !== true
  ) {
    return { ok: false as const, message: unauthorized }
  }

  return { ok: true as const, supabase, userId: user.id }
}
