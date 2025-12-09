"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Search, Filter, X, Database, Hash, Users, Cog, Bug, ExternalLink } from "lucide-react"

interface Batch {
  id: string
  imsOrg: string
  created: number
  createdClient: string
  createdUser: string
  updatedUser: string
  updated: number
  started?: number
  completed?: number
  status: string
  recordCount?: number
  failedRecordCount?: number
  metrics?: {
    startTime: number
    endTime?: number
    recordsRead?: number
    recordsWritten?: number
    profileFragments?: {
      replacedCount: number
      createdCount: number
      updatedCount: number
      deletedCount: number
    }
  }
  relatedObjects: Array<{
    type: string
    id: string
  }>
  errors?: Array<{
    code: string
    description: string
  }>
  tags?: any
  failedBatchLocation?: string
  sandboxId?: string
  version?: string
}

const BATCH_TYPES = {
  DATA_LAKE: "acp_foundation_push",
  IDENTITY: "acp_core_identity_data",
  PROFILE: "acp_core_unifiedProfile_feeds",
  INTERNAL: "acp_foundation_compaction",
} as const

export default function BatchDetailsPage() {
  const searchParams = useSearchParams()
  const initialDatasetId = searchParams.get("datasetId") || ""

  const [datasetId, setDatasetId] = useState(initialDatasetId)
  const [inputValue, setInputValue] = useState(initialDatasetId)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [showInternalJobs, setShowInternalJobs] = useState(false)
  const [filteredDataLakeBatchId, setFilteredDataLakeBatchId] = useState<string | null>(null)
  const [filteredBatchIds, setFilteredBatchIds] = useState<string[]>([])
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchBatches = async (dsId?: string) => {
    setLoading(true)
    try {
      const { fetchWithConfig } = await import("@/lib/fetch-with-config")
      const url = dsId ? `/api/batches?datasetId=${dsId}&limit=100` : `/api/batches?limit=100`
      const response = await fetchWithConfig(url)
      const data = await response.json()
      setBatches(data.batches || [])
    } catch (error) {
      console.error("Failed to fetch batches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterByDataLakeBatch = async (batchId: string) => {
    try {
      setLoading(true)
      const { fetchWithConfig } = await import("@/lib/fetch-with-config")
      const response = await fetchWithConfig(`/api/batches/related?batchId=${batchId}`)
      const data = await response.json()

      const relatedBatchIds = (data.batches || []).map((b: Batch) => b.id)
      setFilteredBatchIds(relatedBatchIds)
      setFilteredDataLakeBatchId(batchId)
    } catch (error) {
      console.error("Failed to fetch related batches:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilter = () => {
    setFilteredDataLakeBatchId(null)
    setFilteredBatchIds([])
  }

  const handleSearch = () => {
    setDatasetId(inputValue)
    clearFilter()
    fetchBatches(inputValue)
  }

  const handleBatchClick = (batch: Batch) => {
    setSelectedBatch(batch)
    setModalOpen(true)
  }

  useEffect(() => {
    if (initialDatasetId) {
      fetchBatches(initialDatasetId)
    }
  }, [initialDatasetId])

  useEffect(() => {
    const handleConfigChange = () => {
      if (datasetId) {
        fetchBatches(datasetId)
      }
    }
    window.addEventListener('configurationChanged', handleConfigChange)
    return () => window.removeEventListener('configurationChanged', handleConfigChange)
  }, [datasetId])

  // Categorize batches
  const dataLakeBatches = batches.filter(b => b.createdClient === BATCH_TYPES.DATA_LAKE)
  const identityBatches = batches.filter(b => b.createdClient === BATCH_TYPES.IDENTITY)
  const profileBatches = batches.filter(b => b.createdClient === BATCH_TYPES.PROFILE)
  const internalBatches = batches.filter(b => b.createdClient === BATCH_TYPES.INTERNAL)
  const unknownBatches = batches.filter(
    b => !Object.values(BATCH_TYPES).includes(b.createdClient as any)
  )

  // Apply filtering
  const filteredDataLakeBatches = filteredDataLakeBatchId
    ? dataLakeBatches.filter(b => b.id === filteredDataLakeBatchId)
    : dataLakeBatches
  const filteredIdentityBatches = filteredDataLakeBatchId
    ? identityBatches.filter(b => filteredBatchIds.includes(b.id))
    : identityBatches
  const filteredProfileBatches = filteredDataLakeBatchId
    ? profileBatches.filter(b => filteredBatchIds.includes(b.id))
    : profileBatches

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      processing: "bg-blue-100 text-blue-800",
      stalled: "bg-yellow-100 text-yellow-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "-"
    return new Date(timestamp).toLocaleString()
  }

  const getRelatedBatchId = (batch: Batch) => {
    const relatedBatch = batch.relatedObjects?.find(obj => obj.type === "batch")
    return relatedBatch?.id
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Batch Details</h1>
            <p className="text-muted-foreground mt-2">
              Monitor batch ingestion and processing pipeline
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <a
                href="https://experienceleague.adobe.com/en/docs/experience-platform/catalog/api/list-objects"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
                Catalog API - Batches
              </a>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Dataset ID..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading} className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
                <Button onClick={() => fetchBatches(datasetId)} disabled={loading} variant="outline" className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showInternal"
                    checked={showInternalJobs}
                    onCheckedChange={(checked) => setShowInternalJobs(!!checked)}
                  />
                  <label htmlFor="showInternal" className="text-sm cursor-pointer">
                    Show Internal Jobs
                  </label>
                </div>

                {filteredDataLakeBatchId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4" />
                    <span>Filtered by DataLake Batch: {filteredDataLakeBatchId}</span>
                    <Button variant="ghost" size="sm" onClick={clearFilter}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DataLake Batches */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              DataLake Batches ({filteredDataLakeBatches.length})
            </CardTitle>
            <CardDescription>Primary data ingestion batches (acp_foundation_push)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDataLakeBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No DataLake batches found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDataLakeBatches.map((batch) => (
                    <TableRow
                      key={batch.id}
                      className={filteredDataLakeBatchId === batch.id ? "bg-blue-50" : ""}
                    >
                      <TableCell>
                        <button
                          onClick={() => handleBatchClick(batch)}
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {batch.id}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(batch.status)}>{batch.status}</Badge>
                      </TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.startTime || batch.started)}</TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.endTime || batch.completed)}</TableCell>
                      <TableCell>
                        {batch.metrics?.recordsRead || batch.recordCount || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFilterByDataLakeBatch(batch.id)}
                          disabled={loading}
                        >
                          Filter UIS/UPS
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Identity Service Batches */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Identity Service Batches ({filteredIdentityBatches.length})
            </CardTitle>
            <CardDescription>Identity graph processing (acp_core_identity_data)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>DataLake Batch</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdentityBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No Identity Service batches found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIdentityBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <button
                          onClick={() => handleBatchClick(batch)}
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {batch.id}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(batch.status)}>{batch.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {getRelatedBatchId(batch) ? (
                          <span className="font-mono text-xs">→ {getRelatedBatchId(batch)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.startTime || batch.started)}</TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.endTime || batch.completed)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Unified Profile Batches */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unified Profile Batches ({filteredProfileBatches.length})
            </CardTitle>
            <CardDescription>Profile ingestion and updates (acp_core_unifiedProfile_feeds)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>DataLake Batch</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Profile Fragments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfileBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No Unified Profile batches found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfileBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <button
                          onClick={() => handleBatchClick(batch)}
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {batch.id}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(batch.status)}>{batch.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {getRelatedBatchId(batch) ? (
                          <span className="font-mono text-xs">→ {getRelatedBatchId(batch)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.startTime || batch.started)}</TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.endTime || batch.completed)}</TableCell>
                      <TableCell>
                        {batch.metrics?.profileFragments ? (
                          <span className="text-xs">
                            +{batch.metrics.profileFragments.createdCount} /
                            ~{batch.metrics.profileFragments.updatedCount}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Internal Jobs */}
        {showInternalJobs && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                Internal Jobs ({internalBatches.length})
              </CardTitle>
              <CardDescription>Internal platform jobs (acp_foundation_compaction)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No internal jobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    internalBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <button
                            onClick={() => handleBatchClick(batch)}
                            className="font-mono text-xs text-blue-600 hover:underline"
                          >
                            {batch.id}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(batch.status)}>{batch.status}</Badge>
                        </TableCell>
                        <TableCell>{formatTimestamp(batch.metrics?.startTime || batch.started)}</TableCell>
                        <TableCell>{formatTimestamp(batch.metrics?.endTime || batch.completed)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Debugging Table */}
        {unknownBatches.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debugging - Unknown Batch Types ({unknownBatches.length})
              </CardTitle>
              <CardDescription>Batches with unrecognized createdClient values</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Created Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unknownBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <button
                          onClick={() => handleBatchClick(batch)}
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {batch.id}
                        </button>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{batch.createdClient}</code>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(batch.status)}>{batch.status}</Badge>
                      </TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.startTime || batch.started)}</TableCell>
                      <TableCell>{formatTimestamp(batch.metrics?.endTime || batch.completed)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Batch Detail Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-[95vw] w-full max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="break-all">Batch Details: {selectedBatch?.id}</DialogTitle>
              <DialogDescription>Complete batch information and metadata</DialogDescription>
            </DialogHeader>

            {selectedBatch && (
              <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge className={getStatusBadge(selectedBatch.status)}>{selectedBatch.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created Client</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">{selectedBatch.createdClient}</code>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm">{formatTimestamp(selectedBatch.created)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-sm">{formatTimestamp(selectedBatch.completed)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium">Created By</p>
                        <p className="text-sm font-mono text-xs break-all">{selectedBatch.createdUser}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium">Sandbox ID</p>
                        <p className="text-sm font-mono text-xs break-all">{selectedBatch.sandboxId || "-"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Related Objects</p>
                      <div className="space-y-1">
                        {selectedBatch.relatedObjects?.map((obj, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{obj.type}:</span>{" "}
                            <span className="font-mono text-xs break-all">{obj.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-4 mt-0">
                    {selectedBatch.metrics ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Start Time</p>
                          <p className="text-sm">{formatTimestamp(selectedBatch.metrics.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">End Time</p>
                          <p className="text-sm">{formatTimestamp(selectedBatch.metrics.endTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Records Read</p>
                          <p className="text-sm">{selectedBatch.metrics.recordsRead?.toLocaleString() || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Records Written</p>
                          <p className="text-sm">{selectedBatch.metrics.recordsWritten?.toLocaleString() || "-"}</p>
                        </div>
                        {selectedBatch.metrics.profileFragments && (
                          <>
                            <div>
                              <p className="text-sm font-medium">Profiles Created</p>
                              <p className="text-sm">{selectedBatch.metrics.profileFragments.createdCount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Profiles Updated</p>
                              <p className="text-sm">{selectedBatch.metrics.profileFragments.updatedCount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Profiles Replaced</p>
                              <p className="text-sm">{selectedBatch.metrics.profileFragments.replacedCount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Profiles Deleted</p>
                              <p className="text-sm">{selectedBatch.metrics.profileFragments.deletedCount.toLocaleString()}</p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No metrics available for this batch</p>
                    )}
                  </TabsContent>

                  <TabsContent value="errors" className="space-y-4 mt-0">
                    {selectedBatch.errors && selectedBatch.errors.length > 0 ? (
                      <div className="space-y-4">
                        {selectedBatch.errors.map((error, idx) => (
                          <div key={idx} className="border p-4 rounded-lg">
                            <p className="font-medium text-red-600 break-all">{error.code}</p>
                            <p className="text-sm mt-2 whitespace-pre-wrap break-words">{error.description}</p>
                          </div>
                        ))}
                        {selectedBatch.failedBatchLocation && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Failed Batch Location</p>
                            <a
                              href={selectedBatch.failedBatchLocation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline font-mono break-all"
                            >
                              {selectedBatch.failedBatchLocation}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No errors for this batch</p>
                    )}
                  </TabsContent>

                  <TabsContent value="raw" className="mt-0">
                    <pre className="text-xs bg-gray-100 p-4 rounded-lg whitespace-pre-wrap break-words overflow-x-hidden">
                      {JSON.stringify(selectedBatch, null, 2)}
                    </pre>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
