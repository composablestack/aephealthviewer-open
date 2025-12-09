"use client"

import { Header } from "@/components/header"
import { ConfigurationPanel } from "@/components/configuration-panel"
import { ConfigurationList } from "@/components/configuration-list"
import { useState } from "react"
import type { AEPConfig } from "@/lib/config-storage"

export default function ConfigurationPage() {
  const [isLive, setIsLive] = useState(true)
  const [selectedConfig, setSelectedConfig] = useState<AEPConfig | null>(null)
  const [configsKey, setConfigsKey] = useState(0)

  const handleConfigsChange = () => {
    setConfigsKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">AEP Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Adobe Experience Platform connection settings. All configurations are stored locally in your
            browser.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          <div>
            <ConfigurationList
              key={configsKey}
              selectedConfigId={selectedConfig?.id || null}
              onSelectConfig={setSelectedConfig}
              onConfigsChange={handleConfigsChange}
            />
          </div>
          <div>
            <ConfigurationPanel
              selectedConfig={selectedConfig}
              onStatusChange={setIsLive}
              onConfigSaved={handleConfigsChange}
              onDeselectConfig={() => setSelectedConfig(null)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
