"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Loader2, Star, Copy, Check } from "lucide-react"
import { saveConfig, setActiveConfig, type AEPConfig } from "@/lib/config-storage"

interface ConfigurationPanelProps {
  selectedConfig: AEPConfig | null
  onStatusChange: (isLive: boolean) => void
  onConfigSaved: () => void
  onDeselectConfig: () => void
}

export function ConfigurationPanel({ selectedConfig, onStatusChange, onConfigSaved, onDeselectConfig }: ConfigurationPanelProps) {
  const [configName, setConfigName] = useState("")
  const [authMethod, setAuthMethod] = useState<"credentials" | "token">("token")
  const [config, setConfig] = useState({
    clientId: "",
    clientSecret: "",
    orgId: "",
    sandbox: "",
    sandboxId: "",
    authToken: "",
  })
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedToken, setGeneratedToken] = useState("")
  const [tokenCopied, setTokenCopied] = useState(false)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [copiedApiIndex, setCopiedApiIndex] = useState<number | null>(null)

  useEffect(() => {
    if (selectedConfig) {
      setConfigName(selectedConfig.name)
      // Determine auth method based on what's filled in
      if (selectedConfig.authToken) {
        setAuthMethod("token")
      } else {
        setAuthMethod("credentials")
      }
      setConfig({
        clientId: selectedConfig.clientId,
        clientSecret: selectedConfig.clientSecret,
        orgId: selectedConfig.orgId,
        sandbox: selectedConfig.sandbox,
        sandboxId: selectedConfig.sandboxId,
        authToken: selectedConfig.authToken,
      })
    } else {
      // New configuration - reset form
      setConfigName("")
      setAuthMethod("token")
      setConfig({
        clientId: "",
        clientSecret: "",
        orgId: "",
        sandbox: "",
        sandboxId: "",
        authToken: "",
      })
    }
    setTestStatus("idle")
    setTestMessage("")
  }, [selectedConfig])

  const handleInputChange = (field: string, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const testConnection = async () => {
    // Validate based on auth method
    // Note: Sandbox ID is optional - only used for service-to-service tokens with non-prod sandboxes
    if (authMethod === "token") {
      if (!config.authToken.trim()) {
        setTestStatus("error")
        setTestMessage("Please enter a Pre-generated Auth Token")
        return
      }
      if (!config.orgId.trim()) {
        setTestStatus("error")
        setTestMessage("Please enter IMS Organization ID")
        return
      }
      if (!config.sandbox.trim()) {
        setTestStatus("error")
        setTestMessage("Please enter Sandbox Name")
        return
      }
    } else {
      // credentials method
      if (!config.clientId.trim() || !config.clientSecret.trim()) {
        setTestStatus("error")
        setTestMessage("Please enter both Client ID and Client Secret")
        return
      }
      if (!config.orgId.trim()) {
        setTestStatus("error")
        setTestMessage("Please enter IMS Organization ID")
        return
      }
      if (!config.sandbox.trim()) {
        setTestStatus("error")
        setTestMessage("Please enter Sandbox Name")
        return
      }
    }

    setTestStatus("testing")
    setIsLoading(true)
    setTestMessage("")

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (response.ok) {
        setTestStatus("success")
        setTestMessage("Successfully connected to Adobe Experience Platform")
        onStatusChange(true)
      } else {
        setTestStatus("error")
        setTestMessage(result.error || "Failed to connect to AEP")
        onStatusChange(false)
      }
    } catch (error) {
      setTestStatus("error")
      setTestMessage("Network error occurred while testing connection")
      onStatusChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async () => {
    if (!configName.trim()) {
      setTestMessage("Please enter a configuration name")
      setTestStatus("error")
      return
    }

    setIsLoading(true)
    try {
      const configToSave: any = {
        name: configName.trim(),
        ...config,
        isActive: selectedConfig?.isActive || false,
      }

      // Only include id if we're editing an existing selected configuration
      // This ensures "Use This Token" workflow creates NEW configs
      if (selectedConfig?.id) {
        configToSave.id = selectedConfig.id
      }

      await saveConfig(configToSave)

      setTestMessage("Configuration saved successfully to browser storage")
      setTestStatus("success")
      onConfigSaved()
    } catch (error) {
      console.error("Failed to save configuration:", error)
      setTestMessage("Error saving configuration")
      setTestStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetActive = async () => {
    if (!selectedConfig?.id) {
      setTestMessage("Please save the configuration first")
      setTestStatus("error")
      return
    }

    setIsLoading(true)
    try {
      await setActiveConfig(selectedConfig.id)
      setTestMessage("Configuration set as active")
      setTestStatus("success")
      onConfigSaved()
    } catch (error) {
      console.error("Failed to set active configuration:", error)
      setTestMessage("Error setting active configuration")
      setTestStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateToken = async () => {
    if (!config.clientId.trim() || !config.clientSecret.trim()) {
      setTestMessage("Please enter both Client ID and Client Secret")
      setTestStatus("error")
      return
    }

    setGeneratingToken(true)
    setGeneratedToken("")
    setTestMessage("")
    setTestStatus("idle")

    try {
      const tokenResponse = await fetch("/api/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        console.error("Token generation error:", errorData)
        setTestMessage(errorData.error || `Failed to generate token: ${tokenResponse.status}`)
        setTestStatus("error")
        return
      }

      const tokenData = await tokenResponse.json()
      setGeneratedToken(tokenData.access_token)
      setTestMessage("Token generated successfully! You can now copy it or use it directly.")
      setTestStatus("success")
    } catch (error) {
      console.error("Token generation error:", error)
      setTestMessage("Network error occurred while generating token")
      setTestStatus("error")
    } finally {
      setGeneratingToken(false)
    }
  }

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    }
  }

  const handleUseToken = () => {
    if (generatedToken) {
      // Save current values before deselecting
      const currentValues = {
        clientId: config.clientId,
        orgId: config.orgId,
        sandbox: config.sandbox,
        sandboxId: config.sandboxId,
      }

      // Deselect any currently selected configuration to start fresh
      onDeselectConfig()

      // Use setTimeout to ensure the deselect and useEffect complete first
      setTimeout(() => {
        // Clear the form for a new configuration with preserved values
        setConfigName("")
        setConfig({
          clientId: currentValues.clientId, // Keep clientId for x-api-key header
          clientSecret: "", // Clear secret (won't be stored in new config)
          orgId: currentValues.orgId, // Keep orgId
          sandbox: currentValues.sandbox, // Keep sandbox
          sandboxId: currentValues.sandboxId, // Keep sandboxId
          authToken: generatedToken, // Use the generated token
        })
        setAuthMethod("token")
        setGeneratedToken("") // Clear the generated token display
        setTestMessage("Token ready to use. Please enter a new configuration name and save.")
        setTestStatus("success")
      }, 0)
    }
  }

  const handleCopyApi = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedApiIndex(index)
    setTimeout(() => setCopiedApiIndex(null), 2000)
  }

  // Generate API examples with current config
  const getApiExamples = () => {
    // Use selectedConfig if available, otherwise fall back to current form values
    const activeConfig = selectedConfig || config
    const activeToken = activeConfig.authToken || generatedToken || "YOUR_ACCESS_TOKEN"
    const clientId = activeConfig.clientId || "YOUR_CLIENT_ID"
    const orgId = activeConfig.orgId || "YOUR_ORG_ID@AdobeOrg"
    const sandbox = activeConfig.sandbox || "prod"

    // Get the actual current host from window.location
    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : "http://localhost:3003"

    return [
      {
        title: "Get Batches",
        description: "Retrieve batches from Catalog Service",
        curl: `curl -X GET "${baseUrl}/api/batches?limit=50" \\
  -H "x-config-client-id: ${clientId}" \\
  -H "x-config-org-id: ${orgId}" \\
  -H "x-config-sandbox: ${sandbox}" \\
  -H "x-config-auth-token: ${activeToken}"`,
        httpie: `http GET ${baseUrl}/api/batches limit==50 \\
  x-config-client-id:${clientId} \\
  x-config-org-id:${orgId} \\
  x-config-sandbox:${sandbox} \\
  x-config-auth-token:${activeToken}`,
      },
      {
        title: "Get Flow Details",
        description: "Get comprehensive flow details with connections and dataset",
        curl: `curl -X GET "${baseUrl}/api/ingestion/flows/YOUR_FLOW_ID" \\
  -H "x-config-client-id: ${clientId}" \\
  -H "x-config-org-id: ${orgId}" \\
  -H "x-config-sandbox: ${sandbox}" \\
  -H "x-config-auth-token: ${activeToken}"`,
        httpie: `http GET ${baseUrl}/api/ingestion/flows/YOUR_FLOW_ID \\
  x-config-client-id:${clientId} \\
  x-config-org-id:${orgId} \\
  x-config-sandbox:${sandbox} \\
  x-config-auth-token:${activeToken}`,
      },
      {
        title: "Get Related Batches (UIS/UPS)",
        description: "Get Identity and Profile batches for a DataLake batch",
        curl: `curl -X GET "${baseUrl}/api/batches/related?batchId=YOUR_BATCH_ID" \\
  -H "x-config-client-id: ${clientId}" \\
  -H "x-config-org-id: ${orgId}" \\
  -H "x-config-sandbox: ${sandbox}" \\
  -H "x-config-auth-token: ${activeToken}"`,
        httpie: `http GET ${baseUrl}/api/batches/related batchId==YOUR_BATCH_ID \\
  x-config-client-id:${clientId} \\
  x-config-org-id:${orgId} \\
  x-config-sandbox:${sandbox} \\
  x-config-auth-token:${activeToken}`,
      },
      {
        title: "Get Datasets",
        description: "List all datasets from Catalog",
        curl: `curl -X GET "${baseUrl}/api/ingestion/datasets?limit=20" \\
  -H "x-config-client-id: ${clientId}" \\
  -H "x-config-org-id: ${orgId}" \\
  -H "x-config-sandbox: ${sandbox}" \\
  -H "x-config-auth-token: ${activeToken}"`,
        httpie: `http GET ${baseUrl}/api/ingestion/datasets limit==20 \\
  x-config-client-id:${clientId} \\
  x-config-org-id:${orgId} \\
  x-config-sandbox:${sandbox} \\
  x-config-auth-token:${activeToken}`,
      },
      {
        title: "Get Segment Jobs",
        description: "Retrieve segment jobs from Segmentation Service",
        curl: `curl -X GET "${baseUrl}/api/segment-jobs?type=jobs" \\
  -H "x-config-client-id: ${clientId}" \\
  -H "x-config-org-id: ${orgId}" \\
  -H "x-config-sandbox: ${sandbox}" \\
  -H "x-config-auth-token: ${activeToken}"`,
        httpie: `http GET ${baseUrl}/api/segment-jobs type==jobs \\
  x-config-client-id:${clientId} \\
  x-config-org-id:${orgId} \\
  x-config-sandbox:${sandbox} \\
  x-config-auth-token:${activeToken}`,
      },
      {
        title: "Get Destination Flows",
        description: "List all destination flows",
        curl: `curl -X GET "${baseUrl}/api/destinations?type=flows&limit=20" \\
  -H "x-config-client-id: ${clientId}" \\
  -H "x-config-org-id: ${orgId}" \\
  -H "x-config-sandbox: ${sandbox}" \\
  -H "x-config-auth-token: ${activeToken}"`,
        httpie: `http GET ${baseUrl}/api/destinations type==flows limit==20 \\
  x-config-client-id:${clientId} \\
  x-config-org-id:${orgId} \\
  x-config-sandbox:${sandbox} \\
  x-config-auth-token:${activeToken}`,
      },
    ]
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="api-examples">API Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedConfig ? `Edit Configuration: ${selectedConfig.name}` : "New Configuration"}
          </CardTitle>
          <CardDescription>
            Configure your AEP connection settings. You can either provide a client ID and secret for automatic token
            generation, or use a pre-generated auth token. All data is stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="configName">
              Configuration Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="configName"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="e.g., Production, Staging, Demo"
              className={!configName.trim() && testStatus === "error" ? "border-red-500" : ""}
            />
          </div>

          {/* Authentication Method Selector */}
          <div className="space-y-3">
            <Label>Authentication Method <span className="text-red-500">*</span></Label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setAuthMethod("token")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  authMethod === "token"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium mb-1">Pre-generated Token</div>
                <div className="text-xs text-muted-foreground">
                  Use a Bearer token you generated elsewhere
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("credentials")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  authMethod === "credentials"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium mb-1">Client Credentials</div>
                <div className="text-xs text-muted-foreground">
                  Automatically generate token from Client ID + Secret
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Fields Based on Auth Method */}
          {authMethod === "token" ? (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="authToken">
                  Pre-generated Auth Token <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="authToken"
                  value={config.authToken}
                  onChange={(e) => handleInputChange("authToken", e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIsIng1dSI6Imltc19uYTEta2V5LWF0LTEuY2VyIiwia2lkIjoiaW1zX25hMS1rZXktYXQtMSIsIml0dCI6ImF0In0..."
                  rows={4}
                  className="font-mono text-xs break-all whitespace-pre-wrap"
                />
                <p className="text-xs text-muted-foreground">
                  Paste your full Bearer token here. This is the access_token value from your OAuth response.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientIdToken">Client ID (x-api-key)</Label>
                <Input
                  id="clientIdToken"
                  value={config.clientId}
                  onChange={(e) => handleInputChange("clientId", e.target.value)}
                  placeholder="your-api-key"
                />
                <p className="text-xs text-muted-foreground">
                  Used as the x-api-key header for authentication.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Provide your OAuth Client ID and Secret. The system will automatically request an access token using the client_credentials grant type.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">
                    Client ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientId"
                    value={config.clientId}
                    onChange={(e) => handleInputChange("clientId", e.target.value)}
                    placeholder="your-client-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">
                    Client Secret <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => handleInputChange("clientSecret", e.target.value)}
                    placeholder="Enter your client secret"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={handleGenerateToken}
                  disabled={generatingToken}
                  variant="outline"
                  className="w-full"
                >
                  {generatingToken ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating Token...
                    </>
                  ) : (
                    "Generate Bearer Token"
                  )}
                </Button>

                {generatedToken && (
                  <div className="space-y-2">
                    <Label>Generated Token</Label>
                    <Textarea
                      value={generatedToken}
                      readOnly
                      rows={4}
                      className="font-mono text-xs break-all whitespace-pre-wrap"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleCopyToken}
                        variant="outline"
                        size="sm"
                      >
                        {tokenCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {tokenCopied ? "Copied!" : "Copy Token"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUseToken}
                        variant="default"
                        size="sm"
                      >
                        Use This Token
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Common Fields - Always Shown */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Platform Configuration</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgId">
                  IMS Organization ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="orgId"
                  value={config.orgId}
                  onChange={(e) => handleInputChange("orgId", e.target.value)}
                  placeholder="YOUR_ORG_ID@AdobeOrg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sandbox">
                  Sandbox Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sandbox"
                  value={config.sandbox}
                  onChange={(e) => handleInputChange("sandbox", e.target.value)}
                  placeholder="prod or custom sandbox name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sandboxId">Sandbox ID</Label>
              <Input
                id="sandboxId"
                value={config.sandboxId}
                onChange={(e) => handleInputChange("sandboxId", e.target.value)}
                placeholder="e.g., 1234abc3-1234-1234-x1yz-a1232456"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Only used for service-to-service (Client Credentials) authentication with non-prod sandboxes.
                User tokens cannot use sandbox ID.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Test Connection
        </Button>
        <Button onClick={saveConfiguration} disabled={isLoading}>
          Save Configuration
        </Button>
        {selectedConfig && !selectedConfig.isActive && (
          <Button onClick={handleSetActive} variant="outline" disabled={isLoading} className="gap-2">
            <Star className="h-4 w-4" />
            Set as Active
          </Button>
        )}

        {testStatus !== "idle" && (
          <div className="flex items-center gap-2">
            {testStatus === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
            {testStatus === "error" && <XCircle className="h-4 w-4 text-red-500" />}
            {testStatus === "testing" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            <span
              className={`text-sm ${
                testStatus === "success" ? "text-green-600" : testStatus === "error" ? "text-red-600" : "text-blue-600"
              }`}
            >
              {testMessage}
            </span>
          </div>
        )}
      </div>
        </TabsContent>

        <TabsContent value="api-examples" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Examples</CardTitle>
              <CardDescription>
                Pre-populated API examples using {selectedConfig ? `configuration "${selectedConfig.name}"` : "your current configuration"}. Copy and paste these into your terminal or API client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedConfig && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> No configuration selected. API examples show placeholder values. Please select or create a configuration to see actual values.
                  </p>
                </div>
              )}
              {selectedConfig && (!selectedConfig.authToken && !generatedToken) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This configuration uses Client Credentials. The auth token shown is a placeholder. Generate a token in the Configuration tab or use the actual token you obtain.
                  </p>
                </div>
              )}
              {getApiExamples().map((example, index) => (
                <div key={index} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                  <div>
                    <h3 className="font-semibold text-lg">{example.title}</h3>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-mono">cURL</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyApi(example.curl, index * 2)}
                        className="h-7"
                      >
                        {copiedApiIndex === index * 2 ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                      {example.curl}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-mono">HTTPie</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyApi(example.httpie, index * 2 + 1)}
                        className="h-7"
                      >
                        {copiedApiIndex === index * 2 + 1 ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                      {example.httpie}
                    </pre>
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-3">Additional Resources</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Full API Documentation:</strong>{" "}
                    <a
                      href="https://github.com/composablestack/aep-health-viewer/blob/main/API.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      API.md
                    </a>
                  </div>
                  <div>
                    <strong>OpenAPI Spec:</strong>{" "}
                    <a
                      href="https://github.com/composablestack/aep-health-viewer/blob/main/openapi.yaml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      openapi.yaml
                    </a>
                  </div>
                  <div className="text-muted-foreground pt-2">
                    All API endpoints are available at <code className="text-xs bg-muted px-1 py-0.5 rounded">http://localhost:3003/api/*</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
