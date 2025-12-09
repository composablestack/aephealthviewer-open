import { type NextRequest, NextResponse } from "next/server"
import { getAEPClient } from "@/lib/aep-client"
import { getConfigFromRequest } from "@/lib/get-config-from-request"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const config = getConfigFromRequest(request)

    if (!config) {
      return NextResponse.json({ error: "No AEP configuration provided" }, { status: 400 })
    }

    const flowId = params.id
    console.log(`[flow-details] Fetching flow details for flowId: ${flowId}`)
    const aepClient = await getAEPClient(config)

    // Fetch the main flow details
    console.log(`[flow-details] Fetching flow...`)
    const flowResponse = await aepClient.getSourceFlow(flowId)

    if (!flowResponse || !flowResponse.items || flowResponse.items.length === 0) {
      console.error(`[flow-details] Flow not found: ${flowId}`)
      return NextResponse.json({ error: "Flow not found" }, { status: 404 })
    }

    const flow = flowResponse.items[0]
    console.log(`[flow-details] Flow found: ${flow.name}`)

    // Fetch source connection details
    let sourceConnection = null
    if (flow.sourceConnectionIds && flow.sourceConnectionIds.length > 0) {
      try {
        console.log(`[flow-details] Fetching source connection: ${flow.sourceConnectionIds[0]}`)
        const sourceConnResponse = await aepClient.getSourceConnection(flow.sourceConnectionIds[0])
        if (sourceConnResponse && sourceConnResponse.items && sourceConnResponse.items.length > 0) {
          sourceConnection = sourceConnResponse.items[0]
          console.log(`[flow-details] Source connection found`)
        }
      } catch (err) {
        console.error(`[flow-details] Failed to fetch source connection:`, err)
        // Continue even if source connection fails
      }
    }

    // Fetch target connection details
    let targetConnection = null
    let dataset = null
    if (flow.targetConnectionIds && flow.targetConnectionIds.length > 0) {
      try {
        console.log(`[flow-details] Fetching target connection: ${flow.targetConnectionIds[0]}`)
        const targetConnResponse = await aepClient.getTargetConnection(flow.targetConnectionIds[0])
        if (targetConnResponse && targetConnResponse.items && targetConnResponse.items.length > 0) {
          targetConnection = targetConnResponse.items[0]
          console.log(`[flow-details] Target connection found`)

          // Fetch dataset if available in target connection params
          if (targetConnection.params && targetConnection.params.dataSetId) {
            try {
              console.log(`[flow-details] Fetching dataset: ${targetConnection.params.dataSetId}`)
              const datasetResponse = await aepClient.getDatasetById(targetConnection.params.dataSetId)
              if (datasetResponse) {
                // Dataset response is an object with dataset ID as key
                const datasetId = targetConnection.params.dataSetId
                dataset = datasetResponse[datasetId] ? { id: datasetId, ...datasetResponse[datasetId] } : null
                console.log(`[flow-details] Dataset found: ${dataset?.name || datasetId}`)
              }
            } catch (err) {
              console.error(`[flow-details] Failed to fetch dataset:`, err)
              // Continue even if dataset fetch fails
            }
          }
        }
      } catch (err) {
        console.error(`[flow-details] Failed to fetch target connection:`, err)
        // Continue even if target connection fails
      }
    }

    // Fetch source connection spec
    let sourceConnectionSpec = null
    if (sourceConnection && sourceConnection.connectionSpec && sourceConnection.connectionSpec.id) {
      try {
        console.log(`[flow-details] Fetching source connection spec: ${sourceConnection.connectionSpec.id}`)
        const sourceSpecResponse = await aepClient.getConnectionSpec(sourceConnection.connectionSpec.id)
        if (sourceSpecResponse && sourceSpecResponse.items && sourceSpecResponse.items.length > 0) {
          sourceConnectionSpec = sourceSpecResponse.items[0]
          console.log(`[flow-details] Source connection spec found: ${sourceConnectionSpec.name}`)
        }
      } catch (err) {
        console.error(`[flow-details] Failed to fetch source connection spec:`, err)
        // Continue even if spec fetch fails
      }
    }

    // Fetch target connection spec
    let targetConnectionSpec = null
    if (targetConnection && targetConnection.connectionSpec && targetConnection.connectionSpec.id) {
      try {
        console.log(`[flow-details] Fetching target connection spec: ${targetConnection.connectionSpec.id}`)
        const targetSpecResponse = await aepClient.getConnectionSpec(targetConnection.connectionSpec.id)
        if (targetSpecResponse && targetSpecResponse.items && targetSpecResponse.items.length > 0) {
          targetConnectionSpec = targetSpecResponse.items[0]
          console.log(`[flow-details] Target connection spec found: ${targetConnectionSpec.name}`)
        }
      } catch (err) {
        console.error(`[flow-details] Failed to fetch target connection spec:`, err)
        // Continue even if spec fetch fails
      }
    }

    // Fetch flow runs
    let flowRuns = []
    try {
      console.log(`[flow-details] Fetching flow runs...`)
      const flowRunsResponse = await aepClient.getSourceFlowRuns(flowId)
      flowRuns = flowRunsResponse && flowRunsResponse.items ? flowRunsResponse.items : []
      console.log(`[flow-details] Found ${flowRuns.length} flow runs`)
    } catch (err) {
      console.error(`[flow-details] Failed to fetch flow runs:`, err)
      // Continue even if flow runs fetch fails
    }

    console.log(`[flow-details] Successfully fetched all flow details`)

    // Return comprehensive flow details
    return NextResponse.json({
      flow,
      sourceConnection,
      targetConnection,
      sourceConnectionSpec,
      targetConnectionSpec,
      dataset,
      flowRuns,
    })
  } catch (error) {
    console.error("[flow-details] Failed to fetch flow details:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({
      error: "Internal server error",
      details: errorMessage
    }, { status: 500 })
  }
}
