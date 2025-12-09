"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { OAuthTokenInput } from "./oauth-token-input"
import type { AEPEvent } from "@/lib/types"

interface EventEnrichmentProps {
  event: AEPEvent
  onEventUpdated: (updatedEvent: AEPEvent) => void
}

export function EventEnrichment({ event, onEventUpdated }: EventEnrichmentProps) {
  const [validatedToken, setValidatedToken] = useState<string | null>(null)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentResult, setEnrichmentResult] = useState<{
    success: boolean
    message: string
    enrichedData?: any
  } | null>(null)

  const isAlreadyEnriched = event.payload._enriched !== undefined

  const enrichEvent = async () => {
    if (!validatedToken) {
      setEnrichmentResult({
        success: false,
        message: "Please validate your OAuth token first",
      })
      return
    }

    setIsEnriching(true)
    setEnrichmentResult(null)

    try {
      const response = await fetch(`/api/events/${event.id}/enrich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: validatedToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setEnrichmentResult({
          success: true,
          message: "Event enriched successfully",
          enrichedData: data.enriched_data,
        })
        onEventUpdated(data.event)
      } else {
        setEnrichmentResult({
          success: false,
          message: data.error || "Enrichment failed",
        })
      }
    } catch (error) {
      setEnrichmentResult({
        success: false,
        message: "Network error during enrichment",
      })
    } finally {
      setIsEnriching(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Event Enrichment
            {isAlreadyEnriched && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enriched
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAlreadyEnriched ? (
            <Alert className="border-primary">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription>
                This event has already been enriched with AEP API data on{" "}
                {new Date(event.payload._enriched.enriched_at).toLocaleString()}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Enrich this event with additional data from Adobe Experience Platform APIs. This will fetch related
                profile, segment, dataset, or journey information.
              </p>

              {!validatedToken && <OAuthTokenInput onTokenValidated={setValidatedToken} />}

              {validatedToken && (
                <div className="space-y-3">
                  <Alert className="border-primary">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>OAuth token validated. Ready to enrich event data.</AlertDescription>
                  </Alert>

                  <Button onClick={enrichEvent} disabled={isEnriching} className="w-full">
                    {isEnriching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enriching Event...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Enrich Event Data
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {enrichmentResult && (
            <Alert className={enrichmentResult.success ? "border-primary" : "border-destructive"}>
              <div className="flex items-center gap-2">
                {enrichmentResult.success ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription>{enrichmentResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Display enriched data summary */}
          {isAlreadyEnriched && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Enriched Data Available:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(event.payload._enriched)
                  .filter((key) => key !== "enriched_at" && key !== "enrichment_source")
                  .map((key) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
