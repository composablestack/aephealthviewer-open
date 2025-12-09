import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const config = getConfigFromRequest(request)

    if (!config) {
      return NextResponse.json({ error: "No AEP configuration provided" }, { status: 400 })
    }

    const aepClient = await getAEPClient(config)

    // Get specific Query Service flow
    const flow = await aepClient.get(`/data/foundation/flowservice/flows/${params.id}`)

    // Get flow runs for this flow
    const flowRuns = await aepClient.get(`/data/foundation/flowservice/runs?property=flowId==${params.id}&limit=10`)

    return NextResponse.json({
      flow,
      flowRuns: flowRuns.items || [],
    })
  } catch (error) {
    console.error("Query Service flow API error:", error)
    return NextResponse.json({ error: "Failed to fetch Query Service flow data" }, { status: 500 })
  }
}
