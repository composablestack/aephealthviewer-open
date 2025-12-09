"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitBranch, ArrowRight, Trash2, Edit } from "lucide-react"
import type { AEPEvent, LineageAssignment } from "@/lib/types"

interface LineageVisualizationProps {
  event: AEPEvent
  onEditAssignment?: (assignment: LineageAssignment) => void
}

export function LineageVisualization({ event, onEditAssignment }: LineageVisualizationProps) {
  const [assignments, setAssignments] = useState<LineageAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLineageAssignments = async () => {
    try {
      const response = await fetch(`/api/lineage?event_id=${event.id}`)
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

  const deleteAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/lineage/${assignmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
      } else {
        console.error("[v0] Failed to delete lineage assignment")
      }
    } catch (error) {
      console.error("[v0] Error deleting lineage assignment:", error)
    }
  }

  useEffect(() => {
    fetchLineageAssignments()
  }, [event.id])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Data Lineage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Data Lineage
          <Badge variant="secondary" className="ml-2">
            {assignments.length} assignments
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Lineage Assignments</h3>
              <p className="text-sm text-muted-foreground">
                Create lineage assignments to track data flow between systems.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                  {/* Data Flow Visualization */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs">
                        {assignment.upstream_system}
                      </Badge>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 text-right">
                      <Badge variant="outline" className="text-xs">
                        {assignment.downstream_system}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  {assignment.data_flow_description && (
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                      {assignment.data_flow_description}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="space-x-2">
                      {assignment.assigned_by && <span>By: {assignment.assigned_by}</span>}
                      <span>•</span>
                      <span>{new Date(assignment.assigned_at).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-1">
                      {onEditAssignment && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditAssignment(assignment)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAssignment(assignment.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
