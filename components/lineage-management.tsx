"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { LineageAssignmentForm } from "./lineage-assignment-form"
import { LineageVisualization } from "./lineage-visualization"
import type { AEPEvent, LineageAssignment } from "@/lib/types"

interface LineageManagementProps {
  event: AEPEvent
  onEventUpdated: (updatedEvent: AEPEvent) => void
}

export function LineageManagement({ event, onEventUpdated }: LineageManagementProps) {
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<LineageAssignment | null>(null)

  const handleAssignmentCreated = async (assignment: any) => {
    // Update the event to mark lineage as assigned
    const updatedEvent = {
      ...event,
      lineage_assigned: true,
      updated_at: new Date().toISOString(),
    }
    onEventUpdated(updatedEvent)
    setShowAssignmentForm(false)
  }

  const handleEditAssignment = (assignment: LineageAssignment) => {
    setEditingAssignment(assignment)
    setShowAssignmentForm(true)
  }

  const handleCancel = () => {
    setShowAssignmentForm(false)
    setEditingAssignment(null)
  }

  return (
    <div className="space-y-4">
      {!showAssignmentForm && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Data Lineage Management</h3>
          <Button onClick={() => setShowAssignmentForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Lineage
          </Button>
        </div>
      )}

      {showAssignmentForm ? (
        <LineageAssignmentForm event={event} onAssignmentCreated={handleAssignmentCreated} onCancel={handleCancel} />
      ) : (
        <LineageVisualization event={event} onEditAssignment={handleEditAssignment} />
      )}
    </div>
  )
}
