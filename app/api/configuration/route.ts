import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    clientId: process.env.AEP_CLIENT_ID || "",
    orgId: process.env.AEP_ORG_ID || "",
    sandbox: process.env.AEP_SANDBOX || "prod",
  })
}

export async function POST(request: Request) {
  try {
    const config = await request.json()

    // For now, we'll just validate the format and return success
    if (!config.clientId || !config.orgId || !config.sandbox) {
      return NextResponse.json({ error: "Missing required configuration fields" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Configuration saved" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}
