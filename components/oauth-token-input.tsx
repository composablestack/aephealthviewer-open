"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Key } from "lucide-react"

interface OAuthTokenInputProps {
  onTokenValidated: (token: string) => void
}

export function OAuthTokenInput({ onTokenValidated }: OAuthTokenInputProps) {
  const [token, setToken] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
  } | null>(null)

  const validateToken = async () => {
    if (!token.trim()) {
      setValidationResult({
        isValid: false,
        message: "Please enter an access token",
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch("/api/oauth/aep-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: token.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResult({
          isValid: true,
          message: "Token validated successfully",
        })
        onTokenValidated(token.trim())
      } else {
        setValidationResult({
          isValid: false,
          message: data.error || "Token validation failed",
        })
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: "Network error during validation",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          AEP OAuth Token
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="oauth-token">Access Token</Label>
          <Input
            id="oauth-token"
            type="password"
            placeholder="Enter your AEP OAuth access token..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            This token will not be stored and is only used temporarily for API enrichment.
          </p>
        </div>

        <Button onClick={validateToken} disabled={isValidating || !token.trim()} className="w-full">
          {isValidating ? "Validating..." : "Validate Token"}
        </Button>

        {validationResult && (
          <Alert className={validationResult.isValid ? "border-primary" : "border-destructive"}>
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription>{validationResult.message}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Required Scopes:</strong> read_pc, read_ups
          </p>
          <p>
            <strong>Token Expiry:</strong> Typically 1 hour
          </p>
          <p>
            <strong>Security:</strong> Token is used in-memory only and never persisted
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
