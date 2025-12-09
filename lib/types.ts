export interface AEPEvent {
  id: string
  event_id: string
  event_type: string
  source_system: string
  payload: Record<string, any>
  timestamp: string
  significance: "low" | "medium" | "high"
  lineage_assigned: boolean
  lineage_notes?: string
  created_at: string
  updated_at: string
}

export interface LineageAssignment {
  id: string
  event_id: string
  upstream_system: string
  downstream_system: string
  data_flow_description?: string
  assigned_by?: string
  assigned_at: string
  created_at: string
}

export interface WebhookPayload {
  event_id: string
  event_type: string
  source_system: string
  data: Record<string, any>
  timestamp?: string
}
