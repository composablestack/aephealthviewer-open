import { type NextRequest, NextResponse } from "next/server"

// Endpoint to validate AEP OAuth token (without storing it)
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 })
    }

    // Validate token by making a simple API call to AEP
    const response = await fetch("https://platform.adobe.io/data/core/ups/config/computedAttributes", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.AEP_API_KEY || "",
        "x-gw-ims-org-id": process.env.AEP_ORG_ID || "",
        "x-sandbox-name": process.env.AEP_SANDBOX || "prod",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Invalid or expired access token", status: response.status }, { status: 401 })
    }

    // Token is valid - return success without storing it
    return NextResponse.json({
      message: "Access token is valid",
      expires_in: 3600, // Typical OAuth token expiry
      scopes: ["read_pc", "read_ups"], // Example AEP scopes
    })
  } catch (error) {
    console.error("[v0] Token validation error:", error)
    return NextResponse.json({ error: "Token validation failed" }, { status: 500 })
  }
}
