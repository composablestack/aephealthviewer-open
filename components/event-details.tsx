"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, ExternalLink } from "lucide-react"
import { EventEnrichment } from "./event-enrichment"
import { LineageManagement } from "./lineage-management"
import type { AEPEvent } from "@/lib/types"

interface EventDetailsProps {
  event: AEPEvent
  onClose: () => void
  onEventUpdated?: (updatedEvent: AEPEvent) => void
}

export function EventDetails({ event, onClose, onEventUpdated }: EventDetailsProps) {
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-secondary text-secondary-foreground"
      case "low":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const isEnriched = event.payload._enriched !== undefined

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Event Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
              <TabsTrigger value="lineage">Lineage</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                  <p className="text-sm text-foreground font-mono">{event.event_type}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Event ID</label>
                  <p className="text-sm text-foreground font-mono break-all">{event.event_id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source System</label>
                  <p className="text-sm text-foreground">{event.source_system}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <p className="text-sm text-foreground">{formatTimestamp(event.timestamp)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Significance</label>
                  <div className="mt-1">
                    <Badge className={getSignificanceColor(event.significance)}>{event.significance}</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lineage Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={event.lineage_assigned ? "default" : "secondary"}>
                      {event.lineage_assigned ? "Assigned" : "Not Assigned"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Enrichment Status</label>
                  <div className="mt-1">
                    <Badge variant={isEnriched ? "default" : "secondary"}>
                      {isEnriched ? "Enriched" : "Not Enriched"}
                    </Badge>
                  </div>
                </div>
              </div>

              {event.lineage_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lineage Notes</label>
                  <p className="text-sm text-foreground mt-1 p-2 bg-muted rounded">{event.lineage_notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-foreground">{formatTimestamp(event.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="text-foreground">{formatTimestamp(event.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database ID:</span>
                    <span className="text-foreground font-mono">{event.id}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payload" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Event Payload</label>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Raw
                  </Button>
                </div>
                <div className="bg-muted rounded p-3">
                  <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enrichment" className="space-y-4">
              {onEventUpdated && <EventEnrichment event={event} onEventUpdated={onEventUpdated} />}
            </TabsContent>

            <TabsContent value="lineage" className="space-y-4">
              {onEventUpdated && <LineageManagement event={event} onEventUpdated={onEventUpdated} />}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
