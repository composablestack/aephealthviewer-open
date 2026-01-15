"use client"

import { useState, useEffect } from "react"
import { EventList } from "@/components/event-list"
import { EventFilters } from "@/components/event-filters"
import { EventDetails } from "@/components/event-details"
import { StatsCards } from "@/components/stats-cards"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { AEPEvent } from "@/lib/types"

export function EventDashboard() {
  const [events, setEvents] = useState<AEPEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AEPEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(5)
  const [webhookError, setWebhookError] = useState(false)
  const [filters, setFilters] = useState({
    eventType: "",
    sourceSystem: "",
    significance: "",
    lineageAssigned: "",
  })

  // Fetch events with filters
  const fetchEvents = async () => {
    if (!autoRefreshEnabled) return

    const { fetchWithConfig } = await import("@/lib/fetch-with-config")
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.eventType) params.append("event_type", filters.eventType)
      if (filters.sourceSystem) params.append("source_system", filters.sourceSystem)
      if (filters.significance) params.append("significance", filters.significance)
      if (filters.lineageAssigned) params.append("lineage_assigned", filters.lineageAssigned)

      const response = await fetchWithConfig(`/api/events?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setEvents(data.events || [])
        setWebhookError(false)
      } else {
        if (response.status === 404) {
          setWebhookError(true)
        } else {
          console.error("[v0] Failed to fetch events:", data.error)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('404')) {
        setWebhookError(true)
      } else {
        console.error("[v0] Error fetching events:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle event updates from enrichment
  const handleEventUpdated = (updatedEvent: AEPEvent) => {
    setEvents((prevEvents) => prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))
    setSelectedEvent(updatedEvent)
  }

  // Fetch when auto-refresh is enabled or filters change (only if auto-refresh is on)
  useEffect(() => {
    if (autoRefreshEnabled) {
      fetchEvents()
    }
  }, [filters, autoRefreshEnabled])

  // Auto-refresh based on interval
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(fetchEvents, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [filters, autoRefreshEnabled, refreshInterval])

  return (
    <div className="space-y-6">
      <StatsCards events={events} />

      {/* Auto-refresh Controls */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefreshEnabled}
            onCheckedChange={setAutoRefreshEnabled}
          />
          <Label htmlFor="auto-refresh" className="text-sm font-medium cursor-pointer">
            Auto-refresh events
          </Label>
        </div>
        {autoRefreshEnabled && (
          <div className="flex items-center gap-2">
            <Label htmlFor="refresh-interval" className="text-sm whitespace-nowrap">
              Interval (seconds):
            </Label>
            <Input
              id="refresh-interval"
              type="number"
              min="1"
              max="300"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Math.max(1, parseInt(e.target.value) || 5))}
              className="w-20 h-8"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <EventFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-2">
          {webhookError && !autoRefreshEnabled && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-yellow-200 text-sm text-muted-foreground">
              ℹ️ Webhook Events not Enabled - Toggle "Auto-refresh events" to enable live event streaming
            </div>
          )}
          {webhookError && autoRefreshEnabled && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-yellow-200 text-sm text-muted-foreground">
              ⚠️ Webhook Events not Enabled - The event streaming endpoint is not available
            </div>
          )}
          <EventList events={events} loading={loading} selectedEvent={selectedEvent} onEventSelect={setSelectedEvent} />
        </div>

        <div className="lg:col-span-1">
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onEventUpdated={handleEventUpdated}
            />
          )}
        </div>
      </div>
    </div>
  )
}
