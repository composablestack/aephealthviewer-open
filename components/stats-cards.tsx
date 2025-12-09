import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import type { AEPEvent } from "@/lib/types"

interface StatsCardsProps {
  events: AEPEvent[]
}

export function StatsCards({ events }: StatsCardsProps) {
  const totalEvents = events.length
  const highSignificance = events.filter((e) => e.significance === "high").length
  const lineageAssigned = events.filter((e) => e.lineage_assigned).length
  const recentEvents = events.filter((e) => {
    const eventTime = new Date(e.timestamp)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return eventTime > oneHourAgo
  }).length

  const stats = [
    {
      title: "Total Events",
      value: totalEvents,
      icon: Activity,
      description: "All captured events",
    },
    {
      title: "High Priority",
      value: highSignificance,
      icon: AlertTriangle,
      description: "High significance events",
    },
    {
      title: "Lineage Assigned",
      value: lineageAssigned,
      icon: CheckCircle,
      description: "Events with lineage data",
    },
    {
      title: "Recent (1h)",
      value: recentEvents,
      icon: Clock,
      description: "Events in last hour",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
