"use client"

import { Suspense } from "react"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import ReportForm from "./report-form"

export default function ReportPage() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <ReportForm />
    </Suspense>
  )
}
