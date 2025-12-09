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
        data = await aepClient.getSourceConnection(params.id)
        break
      case "flow":
        data = await aepClient.getSourceFlow(params.id)
        break
      case "flow-runs":
        data = await aepClient.getSourceFlowRuns(params.id)
        break
      case "flow-run":
        data = await aepClient.getSourceFlowRun(params.id)
        break
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to fetch source data" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Source API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
