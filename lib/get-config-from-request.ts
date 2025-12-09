import { type NextRequest } from "next/server"

export interface AEPConfig {
  clientId: string
  clientSecret: string
  orgId: string
  sandbox: string
  sandboxId?: string
  authToken?: string
}

/**
 * Extracts AEP configuration from request headers
 * The client should send configuration as a base64-encoded JSON string in the x-aep-config header
 */
export function getConfigFromRequest(request: NextRequest | Request): AEPConfig | null {
  try {
    const configHeader = request.headers.get("x-aep-config")

    if (!configHeader) {
      console.error("[get-config] No x-aep-config header found in request")
      return null
    }

    // Decode base64 and parse JSON
    const configJson = Buffer.from(configHeader, "base64").toString("utf-8")
    const config = JSON.parse(configJson) as AEPConfig

    console.log("[get-config] Successfully extracted configuration from request")
    console.log(`[get-config] Org: ${config.orgId}, Sandbox: ${config.sandbox}`)

    return config
  } catch (error) {
    console.error("[get-config] Failed to extract configuration from request:", error)
    return null
  }
}
