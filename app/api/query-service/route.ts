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
    const limit = searchParams.get("limit") || "20"
    const offset = searchParams.get("offset") || "0"

    const aepClient = await getAEPClient(config)

    // Get Query Service flows
    const flows = await aepClient.get(
      `/data/foundation/flowservice/flows?property=flowSpec.id==c1a19761-d2c7-4702-b9fa-fe91f0613e81&limit=${limit}&start=${offset}`,
    )

    return NextResponse.json({
      flows: flows.items || [],
      pagination: {
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
        total: flows._page?.totalCount || 0,
      },
    })
  } catch (error) {
    console.error("Query Service API error:", error)
    return NextResponse.json({ error: "Failed to fetch Query Service data" }, { status: 500 })
  }
}
