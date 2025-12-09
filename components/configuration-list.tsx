"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, CheckCircle } from "lucide-react"
import { getConfigs, deleteConfig, setActiveConfig, type AEPConfig } from "@/lib/config-storage"

interface ConfigurationListProps {
  selectedConfigId: string | null
  onSelectConfig: (config: AEPConfig | null) => void
  onConfigsChange: () => void
}

export function ConfigurationList({ selectedConfigId, onSelectConfig, onConfigsChange }: ConfigurationListProps) {
  const [configs, setConfigs] = useState<AEPConfig[]>([])
  const [loading, setLoading] = useState(true)

  const loadConfigs = async () => {
    try {
      const allConfigs = await getConfigs()
      setConfigs(allConfigs)
    } catch (error) {
      console.error("Failed to load configurations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this configuration?")) {
      try {
        await deleteConfig(id)
        await loadConfigs()
        if (selectedConfigId === id) {
          onSelectConfig(null)
        }
        onConfigsChange()
      } catch (error) {
        console.error("Failed to delete configuration:", error)
      }
    }
  }

  const handleSetActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await setActiveConfig(id)
      await loadConfigs()
      onConfigsChange()
    } catch (error) {
      console.error("Failed to set active configuration:", error)
    }
  }

  const handleNewConfig = () => {
    onSelectConfig(null)
  }

  const handleSelectConfig = (config: AEPConfig) => {
    onSelectConfig(config)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Saved Configurations</CardTitle>
        <Button onClick={handleNewConfig} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {configs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm mb-4">No configurations saved yet</p>
            <Button onClick={handleNewConfig} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Configuration
            </Button>
          </div>
        ) : (
          configs.map((config) => (
            <div
              key={config.id}
              onClick={() => handleSelectConfig(config)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedConfigId === config.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{config.name}</h3>
                    {config.isActive && (
                      <Badge variant="default" className="gap-1 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Org: {config.orgId.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">Sandbox: {config.sandbox}</p>
                </div>
                <div className="flex gap-1">
                  {!config.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleSetActive(config.id!, e)}
                      className="h-8 w-8 p-0"
                      title="Set as active"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(config.id!, e)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
