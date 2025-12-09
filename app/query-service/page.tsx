"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Code } from "lucide-react"

interface QueryFlow {
  id: string
  name: string
  description: string
  state: string
  created: string
  modified: string
  sourceConnectionId: string
  targetConnectionId: string
}

export default function QueryServicePage() {
  const [flows, setFlows] = useState<QueryFlow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { fetchWithConfig } = await import("@/lib/fetch-with-config")
    setLoading(true)
    try {
      const response = await fetchWithConfig("/api/query-service")
      const data = await response.json()
      setFlows(data.flows || [])
    } catch (error) {
      console.error("Failed to fetch Query Service data:", error)
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
      enabled: "bg-green-100 text-green-800",
      disabled: "bg-gray-100 text-gray-800",
      draft: "bg-yellow-100 text-yellow-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Query Service</h1>
            <p className="text-muted-foreground mt-2">Monitor query flows and scheduled queries</p>
          </div>
          <Button onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Query Service Flows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Query Service Flow IDs
              </CardTitle>
              <CardDescription>Active query flows and scheduled queries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flows.map((flow) => (
                    <TableRow key={flow.id}>
                      <TableCell className="font-mono text-sm">{flow.id}</TableCell>
                      <TableCell className="font-medium">{flow.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(flow.state)}>{flow.state}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{flow.description}</TableCell>
                      <TableCell>{new Date(flow.created).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(flow.modified).toLocaleDateString()}</TableCell>
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
