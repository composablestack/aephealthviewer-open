"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  RefreshCw,
  Search,
  GitBranch,
  Database,
  Link2,
  Calendar,
  Shuffle,
  ExternalLink,
  Play
} from "lucide-react"

interface FlowData {
  flow: any
  sourceConnection: any
  targetConnection: any
  sourceConnectionSpec: any
  targetConnectionSpec: any
  dataset: any
  flowRuns: any[]
}

export default function FlowDetailsPage() {
  const searchParams = useSearchParams()
  const initialFlowId = searchParams.get("flowId") || ""

  const [flowId, setFlowId] = useState(initialFlowId)
  const [inputValue, setInputValue] = useState(initialFlowId)
  const [flowData, setFlowData] = useState<FlowData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawJsonOpen, setRawJsonOpen] = useState(false)

  const fetchFlowDetails = async (fId?: string) => {
    const targetFlowId = fId || flowId
    if (!targetFlowId) return

    setLoading(true)
    setError(null)
    try {
      const { fetchWithConfig } = await import("@/lib/fetch-with-config")
      const response = await fetchWithConfig(`/api/ingestion/flows/${targetFlowId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || "Failed to fetch flow details"
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setFlowData(data)
    } catch (err) {
      console.error("Failed to fetch flow details:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load flow details"
      setError(`${errorMessage}. Please check the Flow ID and server logs for more details.`)
      setFlowData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setFlowId(inputValue)
    fetchFlowDetails(inputValue)
  }

  useEffect(() => {
    if (initialFlowId) {
      fetchFlowDetails(initialFlowId)
    }
  }, [initialFlowId])

  useEffect(() => {
    const handleConfigChange = () => {
      if (flowId) {
        fetchFlowDetails(flowId)
      }
    }
    window.addEventListener('configurationChanged', handleConfigChange)
    return () => window.removeEventListener('configurationChanged', handleConfigChange)
  }, [flowId])

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      running: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      enabled: "bg-green-100 text-green-800",
      disabled: "bg-gray-100 text-gray-800",
      partialSuccess: "bg-orange-100 text-orange-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "-"
    return new Date(timestamp).toLocaleString()
  }

  const calculateDuration = (start?: number, end?: number) => {
    if (!start || !end) return "-"
    const durationMs = end - start
    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatSchedule = (scheduleParams: any) => {
    if (!scheduleParams) return "Not scheduled"
    const { frequency, interval } = scheduleParams
    if (interval === 1) {
      return `Every ${frequency}`
    }
    return `Every ${interval} ${frequency}s`
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Flow Details</h1>
            <p className="text-muted-foreground mt-2">
              Monitor data flow configuration, connections, and execution runs
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <a
                href="https://experienceleague.adobe.com/en/docs/experience-platform/sources/api-tutorials/monitor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
                Flow Service Monitor Guide
              </a>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Flow ID..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button onClick={() => fetchFlowDetails()} disabled={loading || !flowId} variant="outline" className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {flowData && (
                <Button onClick={() => setRawJsonOpen(true)} variant="outline" className="gap-2">
                  View Raw JSON
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {flowData && (
          <>
            {/* Flow Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Flow Overview
                </CardTitle>
                <CardDescription>Basic flow information and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-lg font-semibold">{flowData.flow.name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{flowData.flow.description || "No description"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">State</p>
                    <Badge className={getStatusBadge(flowData.flow.state)}>{flowData.flow.state}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Flow Spec ID</p>
                    <p className="text-xs font-mono break-all">{flowData.flow.flowSpec?.id || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm">{formatTimestamp(flowData.flow.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Updated</p>
                    <p className="text-sm">{formatTimestamp(flowData.flow.updatedAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-xs font-mono break-all">{flowData.flow.createdBy || "-"}</p>
                  </div>
                  {flowData.flow.lastRunDetails && (
                    <div className="col-span-2 border-t pt-4 mt-2">
                      <p className="text-sm font-medium mb-2">Last Run Details</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge className={getStatusBadge(flowData.flow.lastRunDetails.state)}>
                            {flowData.flow.lastRunDetails.state}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Run ID</p>
                          <p className="text-xs font-mono break-all">{flowData.flow.lastRunDetails.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Started</p>
                          <p className="text-xs">{formatTimestamp(flowData.flow.lastRunDetails.startedAtUTC)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="text-xs">{formatTimestamp(flowData.flow.lastRunDetails.completedAtUTC)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            {flowData.flow.scheduleParams && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule Information
                  </CardTitle>
                  <CardDescription>Flow execution schedule configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Schedule</p>
                      <p className="text-sm">{formatSchedule(flowData.flow.scheduleParams)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm">{formatTimestamp(flowData.flow.scheduleParams.startTime * 1000)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Frequency</p>
                      <p className="text-sm">{flowData.flow.scheduleParams.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Interval</p>
                      <p className="text-sm">{flowData.flow.scheduleParams.interval}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Backfill</p>
                      <Badge variant={flowData.flow.scheduleParams.backfill ? "default" : "secondary"}>
                        {flowData.flow.scheduleParams.backfill ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Source Connection */}
            {flowData.sourceConnection && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Source Connection
                  </CardTitle>
                  <CardDescription>Source connection configuration and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Connection ID</p>
                      <p className="text-xs font-mono break-all">{flowData.sourceConnection.id}</p>
                    </div>
                    {flowData.sourceConnectionSpec && (
                      <>
                        <div>
                          <p className="text-sm font-medium">Connection Type</p>
                          <p className="text-sm">{flowData.sourceConnectionSpec.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Category</p>
                          <p className="text-sm">{flowData.sourceConnectionSpec.attributes?.category || "-"}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm font-medium">State</p>
                      <Badge className={getStatusBadge(flowData.sourceConnection.state)}>
                        {flowData.sourceConnection.state}
                      </Badge>
                    </div>
                    {flowData.sourceConnection.baseConnectionId && (
                      <div>
                        <p className="text-sm font-medium">Base Connection ID</p>
                        <p className="text-xs font-mono break-all">{flowData.sourceConnection.baseConnectionId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Target Connection & Dataset */}
            {flowData.targetConnection && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Target Connection & Dataset
                  </CardTitle>
                  <CardDescription>Target destination and dataset information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-semibold mb-3">Target Connection</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <p className="text-sm font-medium">Connection ID</p>
                          <p className="text-xs font-mono break-all">{flowData.targetConnection.id}</p>
                        </div>
                        {flowData.targetConnectionSpec && (
                          <>
                            <div>
                              <p className="text-sm font-medium">Connection Type</p>
                              <p className="text-sm">{flowData.targetConnectionSpec.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Category</p>
                              <p className="text-sm">{flowData.targetConnectionSpec.attributes?.category || "-"}</p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-sm font-medium">State</p>
                          <Badge className={getStatusBadge(flowData.targetConnection.state)}>
                            {flowData.targetConnection.state}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Data Format</p>
                          <p className="text-sm">{flowData.targetConnection.data?.format || "-"}</p>
                        </div>
                      </div>
                    </div>

                    {flowData.dataset && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-3">Dataset Details</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <p className="text-sm font-medium">Dataset ID</p>
                            <Link
                              href={`/batch-details?datasetId=${flowData.dataset.id}`}
                              className="text-xs font-mono text-blue-600 hover:underline break-all"
                            >
                              {flowData.dataset.id}
                            </Link>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium">Name</p>
                            <p className="text-sm">{flowData.dataset.name || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">File Format</p>
                            <p className="text-sm">{flowData.dataset.fileDescription?.format || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Ingestion Type</p>
                            <p className="text-sm">{flowData.dataset.ingestionType || "-"}</p>
                          </div>
                          {flowData.dataset.schemaRef && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium">Schema</p>
                              <p className="text-xs font-mono break-all">{flowData.dataset.schemaRef.id || "-"}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transformations */}
            {flowData.flow.transformations && flowData.flow.transformations.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shuffle className="h-5 w-5" />
                    Transformations
                  </CardTitle>
                  <CardDescription>Data transformation and mapping configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Parameters</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flowData.flow.transformations.map((transform: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{transform.name}</TableCell>
                          <TableCell>
                            <pre className="text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap break-words">
                              {JSON.stringify(transform.params, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Flow Runs */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Flow Runs ({flowData.flowRuns.length})
                </CardTitle>
                <CardDescription>Recent execution history for this flow</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flowData.flowRuns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No flow runs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      flowData.flowRuns.map((run: any) => (
                        <TableRow key={run.id}>
                          <TableCell className="font-mono text-xs break-all">{run.id}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(run.status?.state || run.status)}>
                              {run.status?.state || run.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTimestamp(run.metrics?.durationSummary?.startedAtUTC || run.startedAtUTC)}</TableCell>
                          <TableCell>{formatTimestamp(run.metrics?.durationSummary?.completedAtUTC || run.completedAtUTC)}</TableCell>
                          <TableCell>
                            {calculateDuration(
                              run.metrics?.durationSummary?.startedAtUTC || run.startedAtUTC,
                              run.metrics?.durationSummary?.completedAtUTC || run.completedAtUTC
                            )}
                          </TableCell>
                          <TableCell>
                            {run.metrics?.recordSummary?.inputRecordCount
                              ? `${run.metrics.recordSummary.inputRecordCount.toLocaleString()} in / ${run.metrics.recordSummary.outputRecordCount?.toLocaleString() || 0} out`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Raw JSON Modal */}
        <Dialog open={rawJsonOpen} onOpenChange={setRawJsonOpen}>
          <DialogContent className="max-w-[95vw] w-full max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Raw Flow Data (JSON)</DialogTitle>
              <DialogDescription>Complete flow response from Flow Service API</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-words overflow-x-hidden">
                {JSON.stringify(flowData, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
