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
    const type = searchParams.get("type") || "jobs"

    let data
    switch (type) {
      case "jobs":
        data = await aepClient.getSegmentJobs()
        break
      case "definitions":
        data = await aepClient.getSegmentDefinitions()
        break
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to fetch segment jobs data" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Segment Jobs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
