"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface EventFiltersProps {
  filters: {
    eventType: string
    sourceSystem: string
    significance: string
    lineageAssigned: string
  }
  onFiltersChange: (filters: any) => void
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      eventType: "",
      sourceSystem: "",
      significance: "",
      lineageAssigned: "",
    })
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== "")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="event-type">Event Type</Label>
          <Select value={filters.eventType} onValueChange={(value) => updateFilter("eventType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="profile.created">Profile Created</SelectItem>
              <SelectItem value="profile.updated">Profile Updated</SelectItem>
              <SelectItem value="segment.evaluated">Segment Evaluated</SelectItem>
              <SelectItem value="journey.triggered">Journey Triggered</SelectItem>
              <SelectItem value="data.ingested">Data Ingested</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-system">Source System</Label>
          <Select value={filters.sourceSystem} onValueChange={(value) => updateFilter("sourceSystem", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All systems</SelectItem>
              <SelectItem value="AEP">Adobe Experience Platform</SelectItem>
              <SelectItem value="CRM">Customer CRM</SelectItem>
              <SelectItem value="CDP">Customer Data Platform</SelectItem>
              <SelectItem value="Analytics">Analytics Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="significance">Significance</Label>
          <Select value={filters.significance} onValueChange={(value) => updateFilter("significance", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lineage-assigned">Lineage Status</Label>
          <Select value={filters.lineageAssigned} onValueChange={(value) => updateFilter("lineageAssigned", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Assigned</SelectItem>
              <SelectItem value="false">Not Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
