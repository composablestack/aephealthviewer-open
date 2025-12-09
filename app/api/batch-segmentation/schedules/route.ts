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
    const schedules = await aepClient.getBatchSegmentationSchedules()

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("[v0] Failed to fetch batch segmentation schedules:", error)
    return NextResponse.json({ error: "Failed to fetch batch segmentation schedules" }, { status: 500 })
  }
}
