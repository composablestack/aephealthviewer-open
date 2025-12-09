import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: useCases, error } = await supabase
      .from("use_cases")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch use cases:", error)
      return NextResponse.json({ error: "Failed to fetch use cases" }, { status: 500 })
    }

    return NextResponse.json({ useCases })
  } catch (error) {
    console.error("[v0] Use cases API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { data: useCase, error } = await supabase
      .from("use_cases")
      .insert([
        {
          name: body.name,
          description: body.description,
          configuration: body.configuration || {},
          lineage: body.lineage || {},
          expected_behavior: body.expected_behavior,
          functions_used: body.functions_used || [],
          created_by: body.created_by,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to create use case:", error)
      return NextResponse.json({ error: "Failed to create use case" }, { status: 500 })
    }

    return NextResponse.json({ useCase })
  } catch (error) {
    console.error("[v0] Use case creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
