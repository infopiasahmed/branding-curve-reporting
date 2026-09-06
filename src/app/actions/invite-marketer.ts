"use server"

import { getInviteRedirectTo } from "@/lib/app-origin"
import { requireActiveAdmin } from "@/lib/auth/require-active-admin"
import { createSupabaseServiceClient } from "@/lib/supabase/service"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UNAUTHORIZED = "You are not allowed to invite marketers."

export async function inviteMarketerAction(input: {
  firstName: string
  lastName: string
  email: string
}) {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim().toLowerCase()

  if (!firstName) {
    return { ok: false as const, message: "First name is required." }
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { ok: false as const, message: "Enter a valid email address." }
  }

  const authz = await requireActiveAdmin(UNAUTHORIZED)
  if (!authz.ok) return authz

  const admin = createSupabaseServiceClient()
  if (!admin) {
    return {
      ok: false as const,
      message:
        "Email invite is not configured on the server. Add SUPABASE_SERVICE_ROLE_KEY to the server environment and restart the app.",
    }
  }

  const redirectTo = await getInviteRedirectTo()
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name: firstName,
      last_name: lastName,
    },
    redirectTo,
  })
  if (error) {
    return { ok: false as const, message: publicInviteError(error.message) }
  }
  return { ok: true as const, email }
}

function publicInviteError(message: string) {
  const lower = message.toLowerCase()
  if (
    lower.includes("already") ||
    lower.includes("registered") ||
    lower.includes("exists") ||
    lower.includes("duplicate")
  ) {
    return "A user with that email already exists."
  }
  return "Could not send the invitation. Try again or add the user in Authentication → Users."
}
