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

    const client = await getAEPClient(config)
    const response = await client.getAllFlows(Number.parseInt(limit))

    if (!response || !response.items) {
      return NextResponse.json({ error: "Failed to fetch flows" }, { status: 500 })
    }

    // Transform the response to match our interface
    const flows = response.items.map((flow: any) => ({
      id: flow.id,
      name: flow.name || `Flow ${flow.id}`,
      description: flow.description || "No description available",
      state: flow.state || "unknown",
      created: flow.createdAt ? new Date(flow.createdAt).toISOString() : new Date().toISOString(),
      sourceConnectionId: flow.sourceConnectionIds?.[0] || "",
      targetConnectionId: flow.targetConnectionIds?.[0] || "",
      flowSpec: flow.flowSpec,
    }))

    return NextResponse.json({ flows })
  } catch (error) {
    console.error("[v0] Failed to fetch flows:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
