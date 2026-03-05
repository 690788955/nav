import { NextRequest, NextResponse } from "next/server"
import { getFeedbacks, submitFeedback } from "@/lib/actions/feedback"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const toolId = searchParams.get("toolId") || undefined
    const type = searchParams.get("type") || undefined
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined
    const pageSize = searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : undefined
    const sortBy = searchParams.get("sortBy") as "likes" | "time" | undefined

    const result = await getFeedbacks({
      toolId: toolId,
      type: type as any,
      page,
      pageSize,
      sortBy,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error fetching feedbacks:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch feedbacks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolId, type, content, contact } = body

    if (!toolId || !type || !content) {
      return NextResponse.json(
        { success: false, error: "toolId, type, and content are required" },
        { status: 400 }
      )
    }

    const result = await submitFeedback({
      toolId,
      type,
      content,
      contact,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json({ success: false, error: "Failed to submit feedback" }, { status: 500 })
  }
}
