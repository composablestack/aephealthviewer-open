import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const config = getConfigFromRequest(request)
    if (!config) {
      return NextResponse.json({ error: "No AEP configuration provided" }, { status: 400 })
    }

    const client = await getAEPClient(config)
    const batch = await client.getBatchById(params.id)

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    return NextResponse.json({ batch })
  } catch (error) {
    console.error(`[batches/${params.id}] Failed to fetch batch:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
