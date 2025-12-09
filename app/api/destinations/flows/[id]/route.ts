import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const config = getConfigFromRequest(request)

    if (!config) {
      return NextResponse.json({ error: "No AEP configuration provided" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "details"

    const aepClient = await getAEPClient(config)

    if (type === "runs") {
      // Get flow runs for this specific flow
      const flowRuns = await aepClient.getDestinationFlowRuns(params.id)
      return NextResponse.json(flowRuns || { items: [] })
    } else {
      // Get detailed flow information
      const flowDetails = await aepClient.getDestinationFlow(params.id)
      return NextResponse.json(flowDetails || {})
    }
  } catch (error) {
    console.error("Failed to fetch flow details:", error)
    return NextResponse.json({ error: "Failed to fetch flow details" }, { status: 500 })
  }
}
