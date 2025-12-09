import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest) {
  try {
    const config = getConfigFromRequest(request)

    if (!config) {
      return NextResponse.json(
        { status: "unhealthy", error: "No AEP configuration provided" },
        { status: 400 }
      )
    }

    const aepClient = await getAEPClient(config)

    await aepClient.getSegmentSchedules()

    return NextResponse.json({ status: "healthy", timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("[health-check] Health check failed:", error)
    return NextResponse.json({ status: "unhealthy", error: "Failed to connect to AEP" }, { status: 503 })
  }
}
