"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Database, GitBranch, Play, ExternalLink } from "lucide-react"

interface Dataset {
  id: string
  name: string
  description: string
  created: string
  modified: string
  schemaRef?: any
  tags?: any
}

interface Flow {
  id: string
  name: string
  description: string
  state: string
  created: string
  sourceConnectionId: string
  targetConnectionId: string
  flowSpec?: any
}

interface FlowRun {
  id: string
  flowId: string
  status: string
  startedAtUTC: string
  completedAtUTC: string | null
  errors: any[]
  metrics?: any
}

export default function IngestionPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [flows, setFlows] = useState<Flow[]>([])
  const [flowRuns, setFlowRuns] = useState<FlowRun[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { fetchWithConfig } = await import("@/lib/fetch-with-config")

      // Fetch datasets using Catalog API
      const datasetsRes = await fetchWithConfig("/api/ingestion/datasets?limit=20")
      const datasetsData = await datasetsRes.json()
      setDatasets(datasetsData.datasets || [])

      // Fetch flows using Flow Service API
      const flowsRes = await fetchWithConfig("/api/ingestion/flows?limit=20")
      const flowsData = await flowsRes.json()
      setFlows(flowsData.flows || [])

      // Fetch recent flow runs using Flow Service monitoring API
      const flowRunsRes = await fetchWithConfig("/api/ingestion/flow-runs?limit=10")
      const flowRunsData = await flowRunsRes.json()
      setFlowRuns(flowRunsData.flowRuns || [])
    } catch (error) {
      console.error("Failed to fetch ingestion data:", error)
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
      unknown: "bg-gray-100 text-gray-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Ingestion</h1>
            <p className="text-muted-foreground mt-2">
              Monitor datasets, flows, and ingestion runs using AEP Catalog and Flow Service APIs
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <a
                href="https://experienceleague.adobe.com/en/docs/experience-platform/catalog/api/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
                Catalog API Guide
              </a>
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
          <Button onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Datasets Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Datasets
              </CardTitle>
              <CardDescription>Available datasets from AEP Catalog API</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/batch-details?datasetId=${dataset.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {dataset.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{dataset.description}</TableCell>
                      <TableCell>{new Date(dataset.created).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(dataset.modified).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">{dataset.id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Flows Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Data Flows
              </CardTitle>
              <CardDescription>Active data flows from Flow Service API</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Flow ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flows.map((flow) => (
                    <TableRow key={flow.id}>
                      <TableCell className="font-medium">{flow.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(flow.state)}>{flow.state}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{flow.description}</TableCell>
                      <TableCell>{new Date(flow.created).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/flow-details?flowId=${flow.id}`}
                          className="text-blue-600 hover:underline break-all"
                        >
                          {flow.id}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Flow Runs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Recent Flow Runs
              </CardTitle>
              <CardDescription>Latest flow executions from Flow Service monitoring API</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow Run ID</TableHead>
                    <TableHead>Flow ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flowRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-xs">{run.id}</TableCell>
                      <TableCell className="font-mono text-xs">{run.flowId}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(run.status)}>{run.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(run.startedAtUTC).toLocaleString()}</TableCell>
                      <TableCell>{run.completedAtUTC ? new Date(run.completedAtUTC).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        {run.errors.length > 0 ? (
                          <Badge variant="destructive">{run.errors.length} errors</Badge>
                        ) : (
                          <Badge variant="secondary">None</Badge>
                        )}
                      </TableCell>
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
