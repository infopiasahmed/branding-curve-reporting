"use client"

import { FormEvent, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSupabaseConfigured } from "@/lib/env"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isSupabaseConfigured()) {
      toast.error("Password reset is only available when the database is connected.")
      return
    }
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      toast.error("Password reset is only available when the database is connected.")
      return
    }
    setSubmitting(true)
    try {
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw error
      setSent(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset email")
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <p className="rounded-xl border border-border bg-white px-4 py-5 text-sm leading-6 text-muted-foreground">
        If an account exists for that email, we sent a password reset link. Check your inbox and
        spam folder.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-xl bg-white px-3.5 text-base"
          required
        />
      </div>
      <Button type="submit" size="xl" className="w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  )
}
