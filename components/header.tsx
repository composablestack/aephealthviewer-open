"use client"

import { Activity, Settings, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AEPConfig } from "@/lib/config-storage"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLive, setIsLive] = useState(true)
  const [configurations, setConfigurations] = useState<AEPConfig[]>([])
  const [activeConfig, setActiveConfig] = useState<AEPConfig | null>(null)

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/ingestion", label: "Ingestion" },
    { href: "/flow-details", label: "Flow Details" },
    { href: "/batch-details", label: "Batch Details" },
    { href: "/segmentation", label: "Segmentation" },
    { href: "/destinations", label: "Destinations" },
    { href: "/query-service", label: "Query Service" },
    { href: "/configuration", label: "Configuration" },
  ]

  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Dynamically import to avoid SSR issues with IndexedDB
        const { getConfigs, getActiveConfig } = await import("@/lib/config-storage")
        const allConfigs = await getConfigs()
        const active = await getActiveConfig()

        setConfigurations(allConfigs)
        setActiveConfig(active)
      } catch (error) {
        console.error("Failed to load configurations:", error)
      }
    }

    const checkConnection = async () => {
      try {
        const { getActiveConfig } = await import("@/lib/config-storage")
        const config = await getActiveConfig()

        // Skip health check if no configuration is set
        if (!config) {
          setIsLive(false)
          return
        }

        const { fetchWithConfig } = await import("@/lib/fetch-with-config")
        const response = await fetchWithConfig("/api/health-check")
        setIsLive(response.ok)
      } catch (error) {
        console.error("Health check failed:", error)
        setIsLive(false)
      }
    }

    loadConfigurations()
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const handleConfigurationChange = async (configId: string) => {
    try {
      const { setActiveConfig: setActive, getActiveConfig } = await import("@/lib/config-storage")
      await setActive(configId)
      const newActive = await getActiveConfig()
      setActiveConfig(newActive)

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('configurationChanged', { detail: newActive }))
    } catch (error) {
      console.error("Failed to change configuration:", error)
    }
  }

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">AEP Health Viewer</h1>
              <p className="text-sm text-muted-foreground">Adobe Experience Platform Health Monitor</p>
            </div>
          </div>

          <nav className="ml-8 flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            {configurations.length > 0 ? (
              <Select value={activeConfig?.id} onValueChange={handleConfigurationChange}>
                <SelectTrigger size="sm" className="w-[200px]">
                  <SelectValue placeholder="No Configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configurations.map((config) => (
                    <SelectItem key={config.id} value={config.id!}>
                      <div className="flex items-center gap-2">
                        <span>{config.name}</span>
                        {config.isActive && <CheckCircle className="h-3 w-3 text-green-500" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/configuration")}
              >
                No Configuration
              </Button>
            )}

            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => router.push("/configuration")}>
              {isLive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={isLive ? "text-green-600" : "text-red-600"}>{isLive ? "Live" : "Offline"}</span>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
