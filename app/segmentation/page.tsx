"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, Users, Target, Clock, Copy, Check } from "lucide-react"

interface SegmentJob {
  id: string
  status: string
  segments: Array<{
    segmentId: string
    segment: {
      id: string
      expression: {
        type: string
        format: string
        value: string
      }
    }
  }>
  metrics?: {
    totalTime?: {
      startTimeInMs: number
      endTimeInMs: number
      totalTimeInMs: number
    }
    totalProfiles?: number
    segmentedProfileCounter?: Record<string, number>
  }
  creationTime: number
  updateTime: number
}

interface SegmentDefinition {
  id: string
  name: string
  description: string
  expression: {
    type: string
    format: string
    value: string
  }
  evaluationInfo: {
    batch: { enabled: boolean }
    continuous: { enabled: boolean }
    synchronous: { enabled: boolean }
  }
  creationTime: number
  updateTime: number
}

interface Schedule {
  id: string
  name: string
  state: string
  type: string
  schedule: string
  properties: {
    segments: string[]
  }
  createEpoch: number
  updateEpoch: number
}

export default function SegmentationPage() {
  const [segmentJobs, setSegmentJobs] = useState<SegmentJob[]>([])
  const [segmentDefinitions, setSegmentDefinitions] = useState<SegmentDefinition[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<SegmentJob | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchData = async () => {
    const { fetchWithConfig } = await import("@/lib/fetch-with-config")
    setLoading(true)
    try {
      const [jobsResponse, definitionsResponse, schedulesResponse] = await Promise.all([
        fetchWithConfig("/api/segmentation/segment-jobs?limit=20"),
        fetchWithConfig("/api/segmentation/segment-definitions?limit=20"),
        fetchWithConfig("/api/segmentation/schedules?limit=20"),
      ])

      const [jobsData, definitionsData, schedulesData] = await Promise.all([
        jobsResponse.json(),
        definitionsResponse.json(),
        schedulesResponse.json(),
      ])

      setSegmentJobs(jobsData.children || [])
      setSegmentDefinitions(definitionsData.segments || [])
      setSchedules(schedulesData.children || [])
    } catch (error) {
      console.error("Failed to fetch segmentation data:", error)
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
      SUCCEEDED: "bg-green-100 text-green-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      FAILED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const formatDuration = (totalTimeInMs?: number) => {
    if (!totalTimeInMs) return "-"
    const minutes = Math.floor(totalTimeInMs / 60000)
    const seconds = Math.floor((totalTimeInMs % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatCronSchedule = (schedule: string) => {
    // Basic cron schedule interpretation
    if (schedule === "0 0 1 * * ?") return "Daily at 1:00 AM"
    if (schedule === "0 0 2 * * ?") return "Daily at 2:00 AM"
    return schedule
  }

  const handleCopyResponse = () => {
    if (selectedJob) {
      navigator.clipboard.writeText(JSON.stringify(selectedJob, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Segmentation</h1>
            <p className="text-muted-foreground mt-2">Monitor segment jobs, definitions, and schedules</p>
          </div>
          <Button onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Recent Segment Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Segment Jobs
              </CardTitle>
              <CardDescription>Latest segmentation job executions and their performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Segments</TableHead>
                    <TableHead>Total Profiles</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Completed Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentJobs.map((job) => (
                    <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedJob(job)}>
                      <TableCell className="font-mono text-sm text-primary hover:underline">{job.id}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(job.status)}>{job.status}</Badge>
                      </TableCell>
                      <TableCell>{job.segments?.length || 0}</TableCell>
                      <TableCell>{job.metrics?.totalProfiles?.toLocaleString() || "-"}</TableCell>
                      <TableCell>{formatDuration(job.metrics?.totalTime?.totalTimeInMs)}</TableCell>
                      <TableCell>
                        {job.metrics?.totalTime?.startTimeInMs
                          ? new Date(job.metrics.totalTime.startTimeInMs).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {job.metrics?.totalTime?.endTimeInMs
                          ? new Date(job.metrics.totalTime.endTimeInMs).toLocaleString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Segment Definitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Segment Definitions
              </CardTitle>
              <CardDescription>Current segments and their configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Evaluation Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentDefinitions.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="font-mono text-sm">{segment.id}</TableCell>
                      <TableCell className="font-medium">{segment.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{segment.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {segment.evaluationInfo.batch.enabled && <Badge variant="outline">Batch</Badge>}
                          {segment.evaluationInfo.continuous.enabled && <Badge variant="outline">Streaming</Badge>}
                          {segment.evaluationInfo.synchronous.enabled && <Badge variant="outline">Edge</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(segment.creationTime).toLocaleString()}</TableCell>
                      <TableCell>{new Date(segment.updateTime).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Segment Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Segment Schedules
              </CardTitle>
              <CardDescription>Scheduled segment job execution times</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Segments</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-mono text-sm">{schedule.id}</TableCell>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(schedule.state)}>{schedule.state}</Badge>
                      </TableCell>
                      <TableCell>{schedule.type}</TableCell>
                      <TableCell>{formatCronSchedule(schedule.schedule)}</TableCell>
                      <TableCell>
                        {schedule.properties?.segments?.includes("*")
                          ? "All"
                          : schedule.properties?.segments?.length || 0}
                      </TableCell>
                      <TableCell>{new Date(schedule.createEpoch * 1000).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Job Details Modal */}
        <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="sm:max-w-6xl max-w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Segment Job Details</span>
                <Button variant="outline" size="sm" onClick={handleCopyResponse} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Response"}
                </Button>
              </DialogTitle>
            </DialogHeader>

            {selectedJob && (
              <div className="space-y-4">
                {/* Environment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Environment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Job ID</p>
                        <p className="font-mono text-sm">{selectedJob.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusBadge(selectedJob.status)}>{selectedJob.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Start Time</p>
                        <p className="text-sm">
                          {selectedJob.metrics?.totalTime?.startTimeInMs
                            ? formatDateTime(selectedJob.metrics.totalTime.startTimeInMs)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Time</p>
                        <p className="text-sm">
                          {selectedJob.metrics?.totalTime?.endTimeInMs
                            ? formatDateTime(selectedJob.metrics.totalTime.endTimeInMs)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Duration</p>
                        <p className="text-sm">{formatDuration(selectedJob.metrics?.totalTime?.totalTimeInMs)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Profiles</p>
                        <p className="text-sm">{selectedJob.metrics?.totalProfiles?.toLocaleString() || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Full API Response */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Full API Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
                      {JSON.stringify(selectedJob, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
