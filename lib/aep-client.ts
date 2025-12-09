// AEP API client for enriching event data using OAuth tokens
export class AEPClient {
  private baseUrl: string
  private accessToken: string | null = null
  private clientId: string
  private clientSecret: string
  private orgId: string
  private sandbox: string
  private sandboxId?: string
  private preGeneratedToken?: string

  constructor(config: {
    clientId: string
    clientSecret: string
    orgId: string
    sandbox: string
    sandboxId?: string
    authToken?: string
  }) {
    this.baseUrl = `https://platform.adobe.io`
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.orgId = config.orgId
    this.sandbox = config.sandbox
    this.sandboxId = config.sandboxId
    this.preGeneratedToken = config.authToken

    if (!this.orgId) {
      console.error("[aep-client] Organization ID is required")
      throw new Error("Organization ID is required for AEP API authentication")
    }

    console.log("[aep-client] Initialized with configuration:")
    console.log(`  Org ID: ${this.orgId}`)
    console.log(`  Sandbox: ${this.sandbox}`)
    console.log(`  Auth method: ${this.preGeneratedToken ? 'Pre-generated token' : 'Client credentials'}`)
  }

  private async getAccessToken(): Promise<string> {
    // If pre-generated token is provided, use it
    if (this.preGeneratedToken) {
      console.log("[aep-client] Using pre-generated auth token")
      return this.preGeneratedToken
    }

    // Otherwise, check if we already have a generated token
    if (this.accessToken) {
      return this.accessToken
    }

    // Generate new token using client credentials
    try {
      console.log("[aep-client] Requesting AEP access token via client_credentials...")
      const response = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope:
            "openid,AdobeID,read_organizations,additional_info.projectedProductContext,additional_info.job_function,https://ns.adobe.com/s/ent_platform_apis,acp.foundation.catalog",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[aep-client] Token request failed:", response.status, response.statusText, errorText)
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`)
      }

      const tokenData = await response.json()
      this.accessToken = tokenData.access_token
      console.log("[aep-client] Successfully obtained AEP access token")

      // Token expires, so clear it after some time (tokens typically last 24 hours)
      setTimeout(
        () => {
          this.accessToken = null
        },
        23 * 60 * 60 * 1000,
      ) // Clear after 23 hours

      return this.accessToken
    } catch (error) {
      console.error("[aep-client] Failed to get AEP access token:", error)
      throw error
    }
  }

  async makeRequest(endpoint: string, options: RequestInit = {}) {
    const accessToken = await this.getAccessToken()
    const url = `${this.baseUrl}${endpoint}`

    console.log("[aep-client] Making AEP API request to:", url)
    console.log("[aep-client] Using org ID:", this.orgId)
    console.log("[aep-client] Using sandbox:", this.sandbox)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "x-api-key": this.clientId,
      "x-gw-ims-org-id": this.orgId,
      "x-sandbox-name": this.sandbox,
      ...options.headers as Record<string, string>,
    }

    // Only add x-sandbox-id for service-to-service tokens (not pre-generated user tokens)
    if (!this.preGeneratedToken && this.sandboxId && this.sandbox !== "prod") {
      headers["x-sandbox-id"] = this.sandboxId
      console.log("[aep-client] Using sandbox ID:", this.sandboxId)
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[aep-client] AEP API request failed:", response.status, response.statusText, errorText)
      throw new Error(`AEP API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[aep-client] AEP API request successful")
    return data
  }

  // Get profile information for profile-related events
  async getProfile(profileId: string) {
    try {
      return await this.makeRequest(`/data/core/ups/access/entities?entityId=${profileId}&entityIdNS=ECID`)
    } catch (error) {
      console.error("[v0] Failed to fetch profile:", error)
      return null
    }
  }

  // Get segment information for segment-related events
  async getSegment(segmentId: string) {
    try {
      return await this.makeRequest(`/data/core/segmentation/segment-definitions/${segmentId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch segment:", error)
      return null
    }
  }

  // Get dataset information for data ingestion events
  async getDataset(datasetId: string) {
    try {
      return await this.makeRequest(`/data/foundation/catalog/datasets/${datasetId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch dataset:", error)
      return null
    }
  }

  // Get journey information for journey-related events
  async getJourney(journeyId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/flows/${journeyId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch journey:", error)
      return null
    }
  }

  // Generic method to enrich event based on event type
  async enrichEvent(eventType: string, eventPayload: any) {
    const enrichedData: any = {}

    try {
      switch (eventType) {
        case "profile.created":
        case "profile.updated":
          if (eventPayload.profileId) {
            enrichedData.profile = await this.getProfile(eventPayload.profileId)
          }
          break

        case "segment.evaluated":
          if (eventPayload.segmentId) {
            enrichedData.segment = await this.getSegment(eventPayload.segmentId)
          }
          if (eventPayload.profileId) {
            enrichedData.profile = await this.getProfile(eventPayload.profileId)
          }
          break

        case "data.ingested":
          if (eventPayload.datasetId) {
            enrichedData.dataset = await this.getDataset(eventPayload.datasetId)
          }
          break

        case "journey.triggered":
          if (eventPayload.journeyId) {
            enrichedData.journey = await this.getJourney(eventPayload.journeyId)
          }
          if (eventPayload.profileId) {
            enrichedData.profile = await this.getProfile(eventPayload.profileId)
          }
          break

        default:
          console.log(`[v0] No enrichment available for event type: ${eventType}`)
      }

      return enrichedData
    } catch (error) {
      console.error("[v0] Event enrichment failed:", error)
      return {}
    }
  }

  // Sources API methods
  async getSourceConnections() {
    try {
      return await this.makeRequest(
        "/data/foundation/flowservice/connections?property=connectionSpec.id==8a9c3494-9708-43d7-ae3f-cda01e5030e1",
      )
    } catch (error) {
      console.error("[v0] Failed to fetch source connections:", error)
      return null
    }
  }

  async getSourceConnection(connectionId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/connections/${connectionId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch source connection:", error)
      return null
    }
  }

  async getTargetConnection(connectionId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/connections/${connectionId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch target connection:", error)
      return null
    }
  }

  async getSourceFlows() {
    try {
      return await this.makeRequest("/data/foundation/flowservice/flows")
    } catch (error) {
      console.error("[v0] Failed to fetch source flows:", error)
      return null
    }
  }

  async getSourceFlow(flowId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/flows/${flowId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch source flow:", error)
      return null
    }
  }

  async getSourceFlowRuns(flowId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/runs?property=flowId==${flowId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch source flow runs:", error)
      return null
    }
  }

  async getSourceFlowRun(flowRunId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/runs/${flowRunId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch source flow run:", error)
      return null
    }
  }

  // Segment Jobs API methods - using correct Segmentation Service endpoints
  async getSegmentJobs(limit = 20) {
    try {
      console.log("[v0] Fetching segment jobs from Segmentation Service API...")
      return await this.makeRequest(`/data/core/ups/segment/jobs?limit=${limit}`)
    } catch (error) {
      console.error("[v0] Failed to fetch segment jobs:", error)
      throw error
    }
  }

  async getSegmentJob(jobId: string) {
    try {
      return await this.makeRequest(`/data/core/ups/segment/jobs/${jobId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch segment job:", error)
      return null
    }
  }

  // Segment Definitions API methods
  async getSegmentDefinitions(limit = 20) {
    try {
      console.log("[v0] Fetching segment definitions from Segmentation Service API...")
      return await this.makeRequest(`/data/core/ups/segment/definitions?limit=${limit}`)
    } catch (error) {
      console.error("[v0] Failed to fetch segment definitions:", error)
      throw error
    }
  }

  async getSegmentDefinition(segmentId: string) {
    try {
      return await this.makeRequest(`/data/core/ups/segment/definitions/${segmentId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch segment definition:", error)
      return null
    }
  }

  // Schedules API methods
  async getSegmentSchedules(limit = 20) {
    try {
      console.log("[v0] Fetching segment schedules from Segmentation Service API...")
      return await this.makeRequest(`/data/core/ups/config/schedules?limit=${limit}`)
    } catch (error) {
      console.error("[v0] Failed to fetch segment schedules:", error)
      throw error
    }
  }

  async getSegmentSchedule(scheduleId: string) {
    try {
      return await this.makeRequest(`/data/core/ups/config/schedules/${scheduleId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch segment schedule:", error)
      return null
    }
  }

  // Destinations API methods
  async getConnectionSpecs() {
    try {
      console.log("[v0] Fetching connection specs from Flow Service API...")
      return await this.makeRequest("/data/foundation/flowservice/connectionSpecs")
    } catch (error) {
      console.error("[v0] Failed to fetch connection specs:", error)
      throw error
    }
  }

  async getConnectionSpec(connectionSpecId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/connectionSpecs/${connectionSpecId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch connection spec:", error)
      return null
    }
  }

  async getDestinationConnections() {
    try {
      console.log("[v0] Fetching destination connections from Flow Service API...")
      return await this.makeRequest(
        "/data/foundation/flowservice/connections?property=connectionSpec.id!=8a9c3494-9708-43d7-ae3f-cda01e5030e1",
      )
    } catch (error) {
      console.error("[v0] Failed to fetch destination connections:", error)
      return null
    }
  }

  async getDestinationConnection(connectionId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/connections/${connectionId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch destination connection:", error)
      return null
    }
  }

  async getDestinationFlows() {
    try {
      console.log("[v0] Fetching destination flows from Flow Service API...")
      return await this.makeRequest("/data/foundation/flowservice/flows")
    } catch (error) {
      console.error("[v0] Failed to fetch destination flows:", error)
      return null
    }
  }

  async getDestinationFlow(flowId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/flows/${flowId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch destination flow:", error)
      return null
    }
  }

  async getDestinationFlowRuns(flowId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/runs?property=flowId==${flowId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch destination flow runs:", error)
      return null
    }
  }

  async getDestinationFlowRun(flowRunId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/runs/${flowRunId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch destination flow run:", error)
      return null
    }
  }

  // Catalog API methods for datasets
  async getDatasets(limit = 20) {
    try {
      console.log("[v0] Fetching datasets from Catalog API...")
      return await this.makeRequest(`/data/foundation/catalog/datasets/?limit=${limit}&orderBy=desc:created`)
    } catch (error) {
      console.error("[v0] Failed to fetch datasets:", error)
      throw error
    }
  }

  async getDatasetById(datasetId: string) {
    try {
      return await this.makeRequest(`/data/foundation/catalog/datasets/${datasetId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch dataset:", error)
      return null
    }
  }

  async getBatches(datasetId?: string, limit = 50) {
    try {
      console.log("[aep-client] Fetching batches from Catalog API...")
      let endpoint = `/data/foundation/catalog/batches?limit=${limit}&orderBy=desc:created`
      if (datasetId) {
        const encodedDatasetId = encodeURIComponent(datasetId)
        endpoint = `/data/foundation/catalog/batches?property=relatedObjects.id==${encodedDatasetId}&limit=${limit}&orderBy=desc:created`
      }
      return await this.makeRequest(endpoint)
    } catch (error) {
      console.error("[aep-client] Failed to fetch batches:", error)
      throw error
    }
  }

  async getBatchById(batchId: string) {
    try {
      return await this.makeRequest(`/data/foundation/catalog/batches/${batchId}`)
    } catch (error) {
      console.error("[aep-client] Failed to fetch batch:", error)
      return null
    }
  }

  async getRelatedBatches(batchId: string) {
    try {
      console.log("[aep-client] Fetching related batches (UIS/UPS) from Catalog API...")
      return await this.makeRequest(`/data/foundation/catalog/batches?batch=${batchId}`)
    } catch (error) {
      console.error("[aep-client] Failed to fetch related batches:", error)
      throw error
    }
  }

  // Flow Service monitoring methods for data flows
  async getAllFlows(limit = 20) {
    try {
      console.log("[v0] Fetching all flows from Flow Service API...")
      return await this.makeRequest(`/data/foundation/flowservice/flows?limit=${limit}`)
    } catch (error) {
      console.error("[v0] Failed to fetch all flows:", error)
      throw error
    }
  }

  async getAllFlowRuns(limit = 20) {
    try {
      console.log("[v0] Fetching all flow runs from Flow Service API...")
      return await this.makeRequest(`/data/foundation/flowservice/runs?limit=${limit}&orderBy=createdAt:desc`)
    } catch (error) {
      console.error("[v0] Failed to fetch all flow runs:", error)
      return null
    }
  }

  async getFlowSpec(flowSpecId: string) {
    try {
      return await this.makeRequest(`/data/foundation/flowservice/flowSpecs/${flowSpecId}`)
    } catch (error) {
      console.error("[v0] Failed to fetch flow spec:", error)
      return null
    }
  }

  async getFlowsByConnectionSpec(connectionSpecId: string, limit = 20) {
    try {
      console.log(`[v0] Fetching flows for ConnectionSpec ${connectionSpecId} from Flow Service API...`)
      // First get connections for this ConnectionSpec
      const connectionsResponse = await this.makeRequest(
        `/data/foundation/flowservice/connections?property=connectionSpec.id==${connectionSpecId}&limit=100`,
      )

      if (!connectionsResponse?.items?.length) {
        console.log(`[v0] No connections found for ConnectionSpec ${connectionSpecId}`)
        return { items: [] }
      }

      // Extract connection IDs
      const connectionIds = connectionsResponse.items.map((conn: any) => conn.id)

      // Get flows that use these connections (either as source or target)
      const flowsPromises = connectionIds.map(
        (connectionId) =>
          this.makeRequest(
            `/data/foundation/flowservice/flows?property=targetConnectionIds==${connectionId}&limit=${limit}`,
          ).catch(() => ({ items: [] })), // Handle individual failures gracefully
      )

      const flowsResponses = await Promise.all(flowsPromises)

      // Combine all flows and remove duplicates
      const allFlows = flowsResponses.flatMap((response) => response.items || [])
      const uniqueFlows = allFlows.filter((flow, index, self) => index === self.findIndex((f) => f.id === flow.id))

      return { items: uniqueFlows.slice(0, limit) }
    } catch (error) {
      console.error(`[v0] Failed to fetch flows for ConnectionSpec ${connectionSpecId}:`, error)
      return null
    }
  }

  // Get active batch segmentation schedules
  async getBatchSegmentationSchedules() {
    try {
      console.log("[v0] Fetching active batch segmentation schedules...")
      const response = await this.makeRequest("/data/core/ups/config/schedules")

      // Filter for active batch_segmentation schedules
      if (response?.children) {
        const activeSchedules = response.children.filter(
          (schedule: any) => schedule.type === "batch_segmentation" && schedule.state === "active",
        )
        return { children: activeSchedules }
      }
      return response
    } catch (error) {
      console.error("[v0] Failed to fetch batch segmentation schedules:", error)
      throw error
    }
  }

  // Get segment jobs filtered by schedule ID
  async getSegmentJobsBySchedule(scheduleId: string, limit = 20) {
    try {
      console.log(`[v0] Fetching segment jobs for schedule ${scheduleId}...`)
      const encodedScheduleId = encodeURIComponent(`'${scheduleId}'`)
      return await this.makeRequest(
        `/data/core/ups/segment/jobs?property=properties.scheduleId==${encodedScheduleId}&limit=${limit}&sort=creationTime:desc`,
      )
    } catch (error) {
      console.error(`[v0] Failed to fetch segment jobs for schedule ${scheduleId}:`, error)
      throw error
    }
  }

  // Get export jobs filtered by schedule ID
  async getExportJobsBySchedule(scheduleId: string, limit = 20) {
    try {
      console.log(`[v0] Fetching export jobs for schedule ${scheduleId}...`)
      const encodedScheduleId = encodeURIComponent(scheduleId)
      return await this.makeRequest(
        `/data/core/ups/export/jobs/?property=properties.scheduleId==${encodedScheduleId}&limit=${limit}`,
      )
    } catch (error) {
      console.error(`[v0] Failed to fetch export jobs for schedule ${scheduleId}:`, error)
      throw error
    }
  }

  // Get merge policy by ID
  async getMergePolicy(mergePolicyId: string) {
    try {
      console.log(`[v0] Fetching merge policy ${mergePolicyId}...`)
      return await this.makeRequest(`/data/core/ups/config/mergePolicies/${mergePolicyId}`)
    } catch (error) {
      console.error(`[v0] Failed to fetch merge policy ${mergePolicyId}:`, error)
      return null
    }
  }

  // Get dataset with specific properties
  async getDatasetWithProperties(datasetId: string, properties = "name,description,tags,files") {
    try {
      console.log(`[v0] Fetching dataset ${datasetId} with properties...`)
      return await this.makeRequest(`/data/foundation/catalog/datasets/${datasetId}?properties=${properties}`)
    } catch (error) {
      console.error(`[v0] Failed to fetch dataset with properties ${datasetId}:`, error)
      return null
    }
  }

  // Get segment definitions with evaluation info
  async getSegmentDefinitionsDetailed(limit = 50) {
    try {
      console.log("[v0] Fetching detailed segment definitions...")
      return await this.makeRequest(`/data/core/ups/segment/definitions?limit=${limit}`)
    } catch (error) {
      console.error("[v0] Failed to fetch detailed segment definitions:", error)
      throw error
    }
  }

  // Get segment jobs for a specific segment
  async getSegmentJobsForSegment(segmentId: string, limit = 20) {
    try {
      console.log(`[v0] Fetching segment jobs for segment ${segmentId}...`)
      const encodedSegmentId = encodeURIComponent(`'${segmentId}'`)
      return await this.makeRequest(
        `/data/core/ups/segment/jobs?property=segments==${encodedSegmentId}&limit=${limit}&sort=creationTime:desc`,
      )
    } catch (error) {
      console.error(`[v0] Failed to fetch segment jobs for segment ${segmentId}:`, error)
      throw error
    }
  }

  // Get export schedules
  async getExportSchedules() {
    try {
      console.log("[v0] Fetching export schedules...")
      const response = await this.makeRequest("/data/core/ups/config/schedules")

      // Filter for profile export type schedules (can be inactive as they're triggered by segment jobs)
      if (response?.children) {
        const exportSchedules = response.children.filter(
          (schedule: any) =>
            schedule.type === "export" && schedule.properties?.payload?.schema?.name === "_xdm.context.profile",
        )
        return { children: exportSchedules }
      }
      return response
    } catch (error) {
      console.error("[v0] Failed to fetch export schedules:", error)
      throw error
    }
  }

  // Get profile export jobs with predecessor schedule ID extraction
  async getProfileExportJobs(limit = 20) {
    try {
      console.log("[v0] Fetching profile export jobs...")
      const response = await this.makeRequest(
        `/data/core/ups/export/jobs/?showSegmentMetrics=true&limit=${limit}&sort=creationTime:desc`,
      )

      if (response?.children) {
        // Filter for profile schema export jobs and extract predecessor schedule IDs
        const profileExportJobs = response.children
          .filter((job: any) => job.schema?.name === "_xdm.context.profile")
          .map((job: any) => {
            // Extract predecessor schedule ID from runId pattern: SegmentationExportChaining_{scheduleId}_{uuid}
            let predecessorScheduleId = null
            if (job.properties?.runId) {
              const runIdMatch = job.properties.runId.match(/SegmentationExportChaining_([^_]+)_/)
              if (runIdMatch) {
                predecessorScheduleId = runIdMatch[1]
              }
            }

            return {
              ...job,
              properties: {
                ...job.properties,
                predecessorScheduleId,
              },
            }
          })

        return { children: profileExportJobs }
      }
      return response
    } catch (error) {
      console.error("[v0] Failed to fetch profile export jobs:", error)
      throw error
    }
  }

  // Get export job details with metrics and merge policy info
  async getExportJobDetails(jobId: string) {
    try {
      console.log(`[v0] Fetching export job details for ${jobId}...`)
      return await this.makeRequest(`/data/core/ups/export/jobs/${jobId}`)
    } catch (error) {
      console.error(`[v0] Failed to fetch export job details for ${jobId}:`, error)
      return null
    }
  }

  // Get export jobs by predecessor schedule ID
  async getExportJobsByPredecessorSchedule(scheduleId: string, limit = 20) {
    try {
      console.log(`[v0] Fetching export jobs for predecessor schedule ${scheduleId}...`)
      const response = await this.getProfileExportJobs(limit * 2) // Get more to filter

      if (response?.children) {
        const filteredJobs = response.children
          .filter((job: any) => job.properties.predecessorScheduleId === scheduleId)
          .slice(0, limit)

        return { children: filteredJobs }
      }
      return { children: [] }
    } catch (error) {
      console.error(`[v0] Failed to fetch export jobs for predecessor schedule ${scheduleId}:`, error)
      throw error
    }
  }
}

export async function getAEPClient(config: {
  clientId: string
  clientSecret: string
  orgId: string
  sandbox: string
  sandboxId?: string
  authToken?: string
}): Promise<AEPClient> {
  if (!config) {
    throw new Error("AEP configuration is required")
  }

  return new AEPClient(config)
}

// Generic method to make authenticated requests to AEP APIs
export async function get(endpoint: string) {
  const client = await getAEPClient()
  return client.makeRequest(endpoint)
}
