import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest) {
  try {
    const config = getConfigFromRequest(request)
    if (!config) {
      return NextResponse.json({ error: "No AEP configuration provided" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"

    const client = await getAEPClient(config)
    const response = await client.getAllFlowRuns(Number.parseInt(limit))

    if (!response || !response.items) {
      return NextResponse.json({ error: "Failed to fetch flow runs" }, { status: 500 })
    }

    // Transform the response to match our interface
    const flowRuns = response.items.map((run: any) => ({
      id: run.id,
      flowId: run.flowId,
      status: run.metrics?.statusSummary?.status || "unknown",
      startedAtUTC: run.metrics?.durationSummary?.startedAtUTC
        ? new Date(run.metrics.durationSummary.startedAtUTC).toISOString()
        : new Date(run.createdAt).toISOString(),
      completedAtUTC: run.metrics?.durationSummary?.completedAtUTC
        ? new Date(run.metrics.durationSummary.completedAtUTC).toISOString()
        : null,
      errors: run.metrics?.statusSummary?.errors || [],
      metrics: run.metrics,
    }))

    return NextResponse.json({ flowRuns })
  } catch (error) {
    console.error("[v0] Failed to fetch flow runs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
