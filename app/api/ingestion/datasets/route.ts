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
    const response = await client.getDatasets(Number.parseInt(limit))

    if (!response) {
      return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 })
    }

    // Transform the response to match our interface
    const datasets = Object.entries(response).map(([id, dataset]: [string, any]) => ({
      id,
      name: dataset.name || `Dataset ${id}`,
      description: dataset.description || "No description available",
      created: dataset.created ? new Date(dataset.created).toISOString() : new Date().toISOString(),
      modified: dataset.modified ? new Date(dataset.modified).toISOString() : new Date().toISOString(),
      schemaRef: dataset.schemaRef,
      tags: dataset.tags || {},
    }))

    return NextResponse.json({ datasets })
  } catch (error) {
    console.error("[v0] Failed to fetch datasets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
