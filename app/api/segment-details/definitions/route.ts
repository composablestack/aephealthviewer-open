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
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const aepClient = await getAEPClient(config)
    const definitions = await aepClient.getSegmentDefinitionsDetailed(limit)

    return NextResponse.json(definitions)
  } catch (error) {
    console.error("[v0] Failed to fetch segment definitions:", error)
    return NextResponse.json({ error: "Failed to fetch segment definitions" }, { status: 500 })
  }
}
