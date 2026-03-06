import { NextRequest, NextResponse } from "next/server"
import { getVisitStats } from "@/lib/actions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const rawMetric = searchParams.get('metric')
    const metric = rawMetric === 'likes' || rawMetric === 'favorites' ? rawMetric : 'visits'

    const result = await getVisitStats(days, limit, metric)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Error fetching visit stats:", error)
    return NextResponse.json({ error: "Failed to fetch visit stats" }, { status: 500 })
  }
}
