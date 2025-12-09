"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitBranch, ArrowRight, Calendar, Database } from "lucide-react"
import type { LineageAssignment } from "@/lib/types"

export function LineageOverview() {
  const [assignments, setAssignments] = useState<LineageAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllAssignments = async () => {
    try {
      const response = await fetch("/api/lineage")
      const data = await response.json()

      if (response.ok) {
        setAssignments(data.assignments || [])
      } else {
        console.error("[v0] Failed to fetch lineage assignments:", data.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching lineage assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllAssignments()
  }, [])

  // Group assignments by system pairs
  const systemPairs = assignments.reduce(
    (acc, assignment) => {
      const key = `${assignment.upstream_system} → ${assignment.downstream_system}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(assignment)
      return acc
    },
    {} as Record<string, LineageAssignment[]>,
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assignments</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{assignments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Pairs</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{Object.keys(systemPairs).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {
                assignments.filter((a) => {
                  const assignedDate = new Date(a.assigned_at)
                  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
                  return assignedDate > oneDayAgo
                }).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lineage Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Flow Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {Object.keys(systemPairs).length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Lineage Data</h3>
                <p className="text-sm text-muted-foreground">
                  Start assigning lineage to events to see data flow patterns here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(systemPairs).map(([systemPair, pairAssignments]) => (
                  <div key={systemPair} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm">
                          {pairAssignments[0].upstream_system}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-sm">
                          {pairAssignments[0].downstream_system}
                        </Badge>
                      </div>
                      <Badge variant="secondary">{pairAssignments.length} events</Badge>
                    </div>

                    <div className="space-y-2">
                      {pairAssignments.slice(0, 3).map((assignment) => (
                        <div key={assignment.id} className="text-sm bg-muted/50 rounded p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs">
                              {(assignment as any).aep_events?.event_type || "Unknown Event"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(assignment.assigned_at).toLocaleDateString()}
                            </span>
                          </div>
                          {assignment.data_flow_description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {assignment.data_flow_description}
                            </p>
                          )}
                        </div>
                      ))}
                      {pairAssignments.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{pairAssignments.length - 3} more assignments
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
