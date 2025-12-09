"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Target,
  Play,
  Settings,
  Clock,
  ChevronDown,
  ChevronRight,
  Info,
  MapPin,
  Database,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ConnectionSpec {
  id: string
  name: string
  providerId: string
  version: string
  authSpec?: {
    name: string
    type: string
  }
}

interface Destination {
  id: string
  name: string
  description: string
  connectionSpec: {
    name: string
    id: string
  }
  state: string
  created: string
}

interface DestinationFlow {
  id: string
  name: string
  description: string
  state: string
  sourceConnectionIds: string[]
  targetConnectionIds: string[]
  flowSpec: {
    id: string
    version: string
  }
  scheduleParams?: {
    startTime: string
    frequency: string
    interval: number
  }
  createdAt: string
  updatedAt: string
}

interface DetailedFlow extends DestinationFlow {
  flowSpec?: {
    id: string
    version: string
    name?: string
  }
  sourceConnectionIds: string[]
  targetConnectionIds: string[]
  transformations?: any[]
  scheduleParams?: {
    startTime: string
    frequency: string
    interval: number
  }
}

interface FlowRun {
  id: string
  flowId: string
  status: string
  startedAtUTC: string
  completedAtUTC: string
  errors: any[]
  metrics?: {
    recordsProcessed?: number
    recordsWritten?: number
  }
}

export default function DestinationsPage() {
  const [connectionSpecs, setConnectionSpecs] = useState<ConnectionSpec[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [flows, setFlows] = useState<DestinationFlow[]>([])
  const [flowRuns, setFlowRuns] = useState<FlowRun[]>([])
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set())
  const [flowDetails, setFlowDetails] = useState<Record<string, DetailedFlow>>({})
  const [flowRunsData, setFlowRunsData] = useState<Record<string, FlowRun[]>>({})
  const [loadingFlowDetails, setLoadingFlowDetails] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { fetchWithConfig } = await import("@/lib/fetch-with-config")
    setLoading(true)
    try {
      const connectionSpecsRes = await fetchWithConfig("/api/destinations?type=connection-specs")
      const connectionSpecsData = await connectionSpecsRes.json()
      setConnectionSpecs(connectionSpecsData.items || [])

      const destinationsRes = await fetchWithConfig("/api/destinations?type=connections")
      const destinationsData = await destinationsRes.json()
      setDestinations(destinationsData.items || [])

      const flowsRes = await fetchWithConfig("/api/destinations?type=flows")
      const flowsData = await flowsRes.json()
      setFlows(flowsData.items || [])

      // Fetch recent flow runs for destinations
      const flowRunsRes = await fetchWithConfig("/api/destinations?type=flow-runs&limit=15")
      const flowRunsData = await flowRunsRes.json()
      setFlowRuns(flowRunsData.items || [])
    } catch (error) {
      console.error("Failed to fetch destinations data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Listen for configuration changes
    const handleConfigChange = () => {
      fetchData()
    }

    window.addEventListener('configurationChanged', handleConfigChange)

    return () => {
      window.removeEventListener('configurationChanged', handleConfigChange)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      running: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      enabled: "bg-green-100 text-green-800",
      disabled: "bg-gray-100 text-gray-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return "-"
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatSchedule = (scheduleParams?: any) => {
    if (!scheduleParams) return "No schedule"
    const { frequency, interval, startTime } = scheduleParams
    return `${frequency}${interval ? ` (${interval})` : ""} at ${startTime || "N/A"}`
  }

  const toggleFlowExpansion = async (flowId: string) => {
    const { fetchWithConfig } = await import("@/lib/fetch-with-config")
    const newExpanded = new Set(expandedFlows)

    if (expandedFlows.has(flowId)) {
      newExpanded.delete(flowId)
    } else {
      newExpanded.add(flowId)

      // Load detailed flow information if not already loaded
      if (!flowDetails[flowId]) {
        setLoadingFlowDetails((prev) => new Set(prev).add(flowId))

        try {
          const [detailsRes, runsRes] = await Promise.all([
            fetchWithConfig(`/api/destinations/flows/${flowId}?type=details`),
            fetchWithConfig(`/api/destinations/flows/${flowId}?type=runs`),
          ])

          const [details, runs] = await Promise.all([detailsRes.json(), runsRes.json()])

          setFlowDetails((prev) => ({ ...prev, [flowId]: details }))
          setFlowRunsData((prev) => ({ ...prev, [flowId]: runs.items || [] }))
        } catch (error) {
          console.error(`Failed to fetch details for flow ${flowId}:`, error)
        } finally {
          setLoadingFlowDetails((prev) => {
            const newSet = new Set(prev)
            newSet.delete(flowId)
            return newSet
          })
        }
      }
    }

    setExpandedFlows(newExpanded)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Destinations</h1>
            <p className="text-muted-foreground mt-2">
              Monitor destination connections, flows, and activation schedules
            </p>
          </div>
          <Button onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Available Destination Types
              </CardTitle>
              <CardDescription>Connection specifications for supported destinations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Auth Type</TableHead>
                    <TableHead>Connection Spec ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connectionSpecs.slice(0, 10).map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell className="font-medium">{spec.name}</TableCell>
                      <TableCell>{spec.providerId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{spec.version}</Badge>
                      </TableCell>
                      <TableCell>{spec.authSpec?.name || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{spec.id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Destinations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configured Destinations
              </CardTitle>
              <CardDescription>Active destination connections</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinations.map((destination) => (
                    <TableRow key={destination.id}>
                      <TableCell className="font-medium">{destination.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{destination.connectionSpec?.name || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(destination.state)}>{destination.state}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{destination.description}</TableCell>
                      <TableCell>{new Date(destination.created).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Destination Flows & Schedules
              </CardTitle>
              <CardDescription>Dataflows with detailed metadata, schedules, and execution history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flows.map((flow) => (
                  <Collapsible
                    key={flow.id}
                    open={expandedFlows.has(flow.id)}
                    onOpenChange={() => toggleFlowExpansion(flow.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center gap-4">
                          {expandedFlows.has(flow.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div>
                            <div className="font-medium">{flow.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">{flow.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusBadge(flow.state)}>{flow.state}</Badge>
                          <div className="text-sm text-muted-foreground">{formatSchedule(flow.scheduleParams)}</div>
                          <div className="text-sm text-muted-foreground">
                            Updated: {new Date(flow.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        {loadingFlowDetails.has(flow.id) ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading flow details...</span>
                          </div>
                        ) : flowDetails[flow.id] ? (
                          <div className="grid gap-6">
                            {/* Detailed flow metadata section */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Flow Specification
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div>
                                    <span className="text-sm font-medium">Flow Spec ID:</span>
                                    <div className="font-mono text-sm text-muted-foreground">
                                      {flowDetails[flow.id].flowSpec?.id}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium">Version:</span>
                                    <div className="text-sm text-muted-foreground">
                                      {flowDetails[flow.id].flowSpec?.version}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium">Description:</span>
                                    <div className="text-sm text-muted-foreground">
                                      {flowDetails[flow.id].description || "No description"}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Connections
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <span className="text-sm font-medium">Source Connections:</span>
                                    <div className="space-y-1">
                                      {flowDetails[flow.id].sourceConnectionIds?.map((connId) => (
                                        <div
                                          key={connId}
                                          className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                                        >
                                          {connId}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium">Target Connections:</span>
                                    <div className="space-y-1">
                                      {flowDetails[flow.id].targetConnectionIds?.map((connId) => (
                                        <div
                                          key={connId}
                                          className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                                        >
                                          {connId}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Transformations/mapping section */}
                            {flowDetails[flow.id].transformations &&
                              flowDetails[flow.id].transformations.length > 0 && (
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      <Database className="h-4 w-4" />
                                      Data Transformations & Mapping
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      {flowDetails[flow.id].transformations.map((transformation, index) => (
                                        <div key={index} className="border rounded p-3 bg-muted/30">
                                          <div className="text-sm font-medium">Transformation {index + 1}</div>
                                          <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto">
                                            {JSON.stringify(transformation, null, 2)}
                                          </pre>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                            {/* Flow runs section for this specific flow */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Play className="h-4 w-4" />
                                  Flow Execution History ({flowRunsData[flow.id]?.length || 0} runs)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {flowRunsData[flow.id]?.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Run ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Started</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Records Processed</TableHead>
                                        <TableHead>Records Written</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {flowRunsData[flow.id].slice(0, 10).map((run) => (
                                        <TableRow key={run.id}>
                                          <TableCell className="font-mono text-xs">{run.id}</TableCell>
                                          <TableCell>
                                            <Badge className={getStatusBadge(run.status)}>{run.status}</Badge>
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {new Date(run.startedAtUTC).toLocaleString()}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {formatDuration(run.startedAtUTC, run.completedAtUTC)}
                                          </TableCell>
                                          <TableCell>
                                            {run.metrics?.recordsProcessed?.toLocaleString() || "-"}
                                          </TableCell>
                                          <TableCell>{run.metrics?.recordsWritten?.toLocaleString() || "-"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No flow runs found for this flow
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        ) : null}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Destination Flow Runs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Recent Activation Flow Runs
              </CardTitle>
              <CardDescription>Latest destination activation executions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow Run ID</TableHead>
                    <TableHead>Flow ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Records Processed</TableHead>
                    <TableHead>Records Written</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flowRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-sm">{run.id}</TableCell>
                      <TableCell className="font-mono text-sm">{run.flowId}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(run.status)}>{run.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(run.startedAtUTC).toLocaleString()}</TableCell>
                      <TableCell>{formatDuration(run.startedAtUTC, run.completedAtUTC)}</TableCell>
                      <TableCell>{run.metrics?.recordsProcessed?.toLocaleString() || "-"}</TableCell>
                      <TableCell>{run.metrics?.recordsWritten?.toLocaleString() || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
