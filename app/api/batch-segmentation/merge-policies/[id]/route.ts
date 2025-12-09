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
    const mergePolicy = await aepClient.getMergePolicy(params.id)

    if (!mergePolicy) {
      return NextResponse.json({ error: "Merge policy not found" }, { status: 404 })
    }

    return NextResponse.json(mergePolicy)
  } catch (error) {
    console.error("[v0] Failed to fetch merge policy:", error)
    return NextResponse.json({ error: "Failed to fetch merge policy" }, { status: 500 })
  }
}
