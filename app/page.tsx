import { EventDashboard } from "@/components/event-dashboard"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <EventDashboard />
      </main>
    </div>
  )
}
