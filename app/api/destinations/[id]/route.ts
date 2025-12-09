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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "connection"

    let data
    switch (type) {
      case "connection":
        data = await aepClient.getDestinationConnection(params.id)
        break
      case "flow":
        data = await aepClient.getDestinationFlow(params.id)
        break
      case "flow-runs":
        data = await aepClient.getDestinationFlowRuns(params.id)
        break
      case "flow-run":
        data = await aepClient.getDestinationFlowRun(params.id)
        break
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to fetch destination data" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Destination API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
