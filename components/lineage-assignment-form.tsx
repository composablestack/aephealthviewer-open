"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitBranch, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import type { AEPEvent } from "@/lib/types"

interface LineageAssignmentFormProps {
  event: AEPEvent
  onAssignmentCreated: (assignment: any) => void
  onCancel: () => void
}

export function LineageAssignmentForm({ event, onAssignmentCreated, onCancel }: LineageAssignmentFormProps) {
  const [formData, setFormData] = useState({
    upstream_system: "",
    downstream_system: "",
    data_flow_description: "",
    assigned_by: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const commonSystems = [
    "Adobe Experience Platform",
    "Customer CRM",
    "Customer Data Platform",
    "Analytics Platform",
    "Marketing Automation",
    "Data Warehouse",
    "Real-time CDP",
    "Journey Orchestration",
    "Audience Manager",
    "Campaign",
    "Target",
    "Commerce",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/lineage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: event.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onAssignmentCreated(data.assignment)
      } else {
        setError(data.error || "Failed to create lineage assignment")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Assign Data Lineage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upstream-system">Upstream System</Label>
              <Select
                value={formData.upstream_system}
                onValueChange={(value) => updateFormData("upstream_system", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select upstream system" />
                </SelectTrigger>
                <SelectContent>
                  {commonSystems.map((system) => (
                    <SelectItem key={system} value={system}>
                      {system}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom System</SelectItem>
                </SelectContent>
              </Select>
              {formData.upstream_system === "custom" && (
                <Input
                  placeholder="Enter custom upstream system"
                  value={formData.upstream_system}
                  onChange={(e) => updateFormData("upstream_system", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="downstream-system">Downstream System</Label>
              <Select
                value={formData.downstream_system}
                onValueChange={(value) => updateFormData("downstream_system", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select downstream system" />
                </SelectTrigger>
                <SelectContent>
                  {commonSystems.map((system) => (
                    <SelectItem key={system} value={system}>
                      {system}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom System</SelectItem>
                </SelectContent>
              </Select>
              {formData.downstream_system === "custom" && (
                <Input
                  placeholder="Enter custom downstream system"
                  value={formData.downstream_system}
                  onChange={(e) => updateFormData("downstream_system", e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-flow-description">Data Flow Description</Label>
            <Textarea
              id="data-flow-description"
              placeholder="Describe the data flow and transformation between systems..."
              value={formData.data_flow_description}
              onChange={(e) => updateFormData("data_flow_description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned-by">Assigned By</Label>
            <Input
              id="assigned-by"
              placeholder="Your name or identifier"
              value={formData.assigned_by}
              onChange={(e) => updateFormData("assigned_by", e.target.value)}
            />
          </div>

          {error && (
            <Alert className="border-destructive">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.upstream_system || !formData.downstream_system}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Assignment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Lineage Assignment
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
