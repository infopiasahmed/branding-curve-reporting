import type { SupabaseClient } from "@supabase/supabase-js"
import { explainSupabaseError, mapReport } from "@/lib/data/mappers"
import type { DailyReport, ReportTag } from "@/types/domain"

export async function fetchReports(client: SupabaseClient) {
  const { data, error } = await client
    .from("daily_reports")
    .select("*, report_tags(tag)")
    .order("report_date", { ascending: false })
  if (error) throw new Error(explainSupabaseError(error))
  return (data ?? []).map((row) => mapReport(row as never))
}

export async function saveReportRecord(
  client: SupabaseClient,
  userId: string,
  input: {
    id?: string
    clientId: string
    reportDate: string
    content: string
    tomorrowPlan?: string
    tags: ReportTag[]
  }
): Promise<DailyReport> {
  const payload = {
    client_id: input.clientId,
    user_id: userId,
    report_date: input.reportDate,
    content: input.content,
    tomorrow_plan: input.tomorrowPlan ?? null,
  }

  const query = input.id
    ? client.from("daily_reports").update(payload).eq("id", input.id)
    : client.from("daily_reports").upsert(payload, {
        onConflict: "client_id,user_id,report_date",
      })

  const { data, error } = await query.select("*, report_tags(tag)").single()
  if (error) throw new Error(explainSupabaseError(error))

  const reportId = data.id as string
  const { error: deleteError } = await client.from("report_tags").delete().eq("report_id", reportId)
  if (deleteError) throw new Error(explainSupabaseError(deleteError))

  if (input.tags.length > 0) {
    const { error: tagError } = await client.from("report_tags").insert(
      input.tags.map((tag) => ({ report_id: reportId, tag }))
    )
    if (tagError) throw new Error(explainSupabaseError(tagError))
  }

  const { data: fresh, error: reloadError } = await client
    .from("daily_reports")
    .select("*, report_tags(tag)")
    .eq("id", reportId)
    .single()
  if (reloadError) throw new Error(explainSupabaseError(reloadError))
  return mapReport(fresh as never)
}
