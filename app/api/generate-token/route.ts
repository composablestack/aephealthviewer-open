import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { clientId, clientSecret } = await request.json()

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Client ID and Client Secret are required" }, { status: 400 })
    }

    console.log("Generating token with client_credentials grant...")
    console.log("Client ID:", clientId)

    const tokenResponse = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope:
          "openid,AdobeID,read_organizations,additional_info.projectedProductContext,additional_info.job_function,https://ns.adobe.com/s/ent_platform_apis",
      }),
    })

    console.log("IMS Token Response Status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("IMS token error:", errorText)
      return NextResponse.json(
        {
          error: `Failed to generate token: ${tokenResponse.status} ${tokenResponse.statusText}`,
          details: errorText,
        },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log("Successfully generated access token")

    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
    })
  } catch (error) {
    console.error("Token generation failed:", error)
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 })
  }
}
