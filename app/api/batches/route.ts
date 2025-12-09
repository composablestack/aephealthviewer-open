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
    const datasetId = searchParams.get("datasetId") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const client = await getAEPClient(config)
    const response = await client.getBatches(datasetId, limit)

    if (!response) {
      return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 })
    }

    // Transform the response to match our interface
    const batches = Object.entries(response).map(([id, batch]: [string, any]) => ({
      id,
      ...batch,
    }))

    return NextResponse.json({ batches })
  } catch (error) {
    console.error("[batches] Failed to fetch batches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
