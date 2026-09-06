import Link from "next/link"
import { ForgotPasswordForm } from "./forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-dvh bg-neutral-200/70">
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col justify-center bg-background px-6 py-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
            BC
          </div>
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            Branding Curve
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter your email and we will send a reset link if an account exists.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline-offset-4 hover:text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
