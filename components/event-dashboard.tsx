"use client"

import { useState, useEffect } from "react"
import { EventList } from "@/components/event-list"
import { EventFilters } from "@/components/event-filters"
import { EventDetails } from "@/components/event-details"
import { StatsCards } from "@/components/stats-cards"
import type { AEPEvent } from "@/lib/types"

export function EventDashboard() {
  const [events, setEvents] = useState<AEPEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AEPEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    eventType: "",
    sourceSystem: "",
    significance: "",
    lineageAssigned: "",
  })

  // Fetch events with filters
  const fetchEvents = async () => {
    const { fetchWithConfig } = await import("@/lib/fetch-with-config")
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
      } else {
        console.error("[v0] Failed to fetch events:", data.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle event updates from enrichment
  const handleEventUpdated = (updatedEvent: AEPEvent) => {
    setEvents((prevEvents) => prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))
    setSelectedEvent(updatedEvent)
  }

  // Initial load and filter changes
  useEffect(() => {
    fetchEvents()
  }, [filters])

  // Auto-refresh every 5 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(fetchEvents, 5000)
    return () => clearInterval(interval)
  }, [filters])

  return (
    <div className="space-y-6">
      <StatsCards events={events} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <EventFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-2">
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
