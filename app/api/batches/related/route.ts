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
    const batchId = searchParams.get("batchId")

    if (!batchId) {
      return NextResponse.json({ error: "batchId parameter is required" }, { status: 400 })
    }

    const client = await getAEPClient(config)
    const response = await client.getRelatedBatches(batchId)

    if (!response) {
      return NextResponse.json({ error: "Failed to fetch related batches" }, { status: 500 })
    }

    // Transform the response to match our interface
    const batches = Object.entries(response).map(([id, batch]: [string, any]) => ({
      id,
      ...batch,
    }))

    return NextResponse.json({ batches })
  } catch (error) {
    console.error("[batches/related] Failed to fetch related batches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
