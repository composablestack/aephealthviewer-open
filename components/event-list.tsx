"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, Clock, AlertTriangle } from "lucide-react"
import type { AEPEvent } from "@/lib/types"

interface EventListProps {
  events: AEPEvent[]
  loading: boolean
  selectedEvent: AEPEvent | null
  onEventSelect: (event: AEPEvent) => void
}

export function EventList({ events, loading, selectedEvent, onEventSelect }: EventListProps) {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Event Stream
          <Badge variant="secondary" className="text-xs">
            {events.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
              <p className="text-sm text-muted-foreground">Waiting for AEP webhook events to arrive...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedEvent?.id === event.id ? "bg-primary/10 border-primary" : "bg-card"
                  }`}
                  onClick={() => onEventSelect(event)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground truncate">{event.event_type}</span>
                        <Badge className={`text-xs ${getSignificanceColor(event.significance)}`}>
                          {event.significance}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{event.source_system}</span>
                        <span>•</span>
                        <span>{formatTimestamp(event.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {event.lineage_assigned ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      )}
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
