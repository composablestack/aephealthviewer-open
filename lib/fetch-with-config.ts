import { getActiveConfig } from "./config-storage"

/**
 * Client-side fetch wrapper that automatically includes active AEP configuration in headers
 * Use this instead of regular fetch() for API requests that need AEP credentials
 */
export async function fetchWithConfig(url: string, options: RequestInit = {}): Promise<Response> {
  const activeConfig = await getActiveConfig()

  if (!activeConfig) {
    throw new Error("No active AEP configuration found. Please configure your connection first.")
  }

  // Prepare config for transmission (exclude sensitive data from logs)
  const configForTransmission = {
    clientId: activeConfig.clientId,
    clientSecret: activeConfig.clientSecret,
    orgId: activeConfig.orgId,
    sandbox: activeConfig.sandbox,
    sandboxId: activeConfig.sandboxId,
    authToken: activeConfig.authToken,
  }

  // Encode configuration as base64 JSON
  const configJson = JSON.stringify(configForTransmission)
  const configHeader = Buffer.from(configJson).toString("base64")

  // Merge headers
  const headers = new Headers(options.headers)
  headers.set("x-aep-config", configHeader)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  return response
}

/**
 * Helper to safely parse JSON responses with better error messages
 */
export async function parseJsonResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type")

  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text()

    // Check if it's an HTML error page
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      throw new Error(
        `API returned an HTML error page instead of JSON. This usually means:\n` +
        `1. The API endpoint doesn't exist (404)\n` +
        `2. There's a server error (500)\n` +
        `3. Authentication failed\n\n` +
        `Please check:\n` +
        `- Your AEP configuration is correct\n` +
        `- The API endpoint exists\n` +
        `- Your credentials are valid\n\n` +
        `URL: ${response.url}\n` +
        `Status: ${response.status} ${response.statusText}`
      )
    }

    throw new Error(
      `Expected JSON response but got ${contentType || "unknown content type"}.\n` +
      `URL: ${response.url}\n` +
      `Status: ${response.status} ${response.statusText}`
    )
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response. The server returned invalid JSON.\n` +
      `URL: ${response.url}\n` +
      `Status: ${response.status} ${response.statusText}\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
