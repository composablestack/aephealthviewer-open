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
    const type = searchParams.get("type") || "job"

    let data
    switch (type) {
      case "job":
        data = await aepClient.getSegmentJob(params.id)
        break
      case "definition":
        data = await aepClient.getSegmentDefinition(params.id)
        break
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to fetch segment job data" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Segment Job API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
