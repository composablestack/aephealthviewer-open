import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const config = getConfigFromRequest(request)

    if (!config) {
      return NextResponse.json({ error: "No AEP configuration provided" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const properties = searchParams.get("properties") || "name,description,tags,files"

    const aepClient = await getAEPClient(config)
    const dataset = await aepClient.getDatasetWithProperties(params.id, properties)

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    return NextResponse.json(dataset)
  } catch (error) {
    console.error("[v0] Failed to fetch dataset:", error)
    return NextResponse.json({ error: "Failed to fetch dataset" }, { status: 500 })
  }
}
