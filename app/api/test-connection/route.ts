import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const config = await request.json()

    let accessToken = config.authToken

    // If no pre-generated auth token, try to get one via client credentials
    if (!accessToken) {
      if (!config.clientId || !config.clientSecret) {
        return NextResponse.json({ error: "Either provide an auth token or both client ID and secret" }, { status: 400 })
      }

      console.log("Attempting client_credentials authentication...")
      console.log("Client ID:", config.clientId)
      console.log("Client Secret:", config.clientSecret ? "[PROVIDED]" : "[MISSING]")

      const tokenResponse = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope:
            "openid,AdobeID,read_organizations,additional_info.projectedProductContext,additional_info.job_function,https://ns.adobe.com/s/ent_platform_apis",
        }),
      })

      console.log("IMS Token Response Status:", tokenResponse.status)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error("IMS token error:", errorText)
        return NextResponse.json({
          error: `Failed to authenticate with Adobe IMS: ${tokenResponse.status} ${tokenResponse.statusText}. ${errorText}`
        }, { status: 401 })
      }

      const tokenData = await tokenResponse.json()
      console.log("Successfully obtained access token")
      accessToken = tokenData.access_token
    }

    // Build headers for AEP API test
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": config.clientId,
      "x-gw-ims-org-id": config.orgId,
      "x-sandbox-name": config.sandbox,
      "Content-Type": "application/json",
    }

    // Only add x-sandbox-id for service-to-service tokens (client_credentials flow)
    // User tokens from authorization_code flow will fail with "User tokens cant provide sandboxId"
    // Only include if we generated the token ourselves (not pre-generated) and sandboxId is provided
    if (!config.authToken && config.sandboxId && config.sandbox !== "prod") {
      headers["x-sandbox-id"] = config.sandboxId
    }

    const testResponse = await fetch("https://platform.adobe.io/data/foundation/catalog/datasets/?limit=1", {
      headers,
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error("AEP API test error:", errorText)
      return NextResponse.json({ error: `Failed to connect to Adobe Experience Platform APIs: ${testResponse.status} ${testResponse.statusText}` }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Adobe Experience Platform",
      orgId: config.orgId,
      sandbox: config.sandbox,
    })
  } catch (error) {
    console.error("[v0] Connection test failed:", error)
    return NextResponse.json({ error: "Connection test failed" }, { status: 500 })
  }
}
