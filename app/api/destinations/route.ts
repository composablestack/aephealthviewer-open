import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest) {
  try {
    const config = getConfigFromRequest(request)
    if (!config) {
      return NextResponse.json({ error: "No AEP configuration provided" }, { status: 400 })
    }

    const aepClient = await getAEPClient(config)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "connections"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const connectionSpecId = searchParams.get("connectionSpecId")

    let data
    switch (type) {
      case "connections":
        data = await aepClient.getDestinationConnections()
        break
      case "flows":
        if (connectionSpecId) {
          data = await aepClient.getFlowsByConnectionSpec(connectionSpecId, limit)
        } else {
          data = await aepClient.getDestinationFlows()
        }
        break
      case "connection-specs":
        data = await aepClient.getConnectionSpecs()
        break
      case "flow-runs":
        data = await aepClient.getAllFlowRuns(limit)
        break
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to fetch destinations data" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Destinations API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
