import { NextRequest, NextResponse } from "next/server"
import { likeFeedback, unlikeFeedback } from "@/lib/actions/likes"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: "Feedback ID is required" }, { status: 400 })
    }

    const result = await likeFeedback(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error liking feedback:", error)
    return NextResponse.json({ success: false, error: "Failed to like feedback" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: "Feedback ID is required" }, { status: 400 })
    }

    const result = await unlikeFeedback(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error unliking feedback:", error)
    return NextResponse.json({ success: false, error: "Failed to unlike feedback" }, { status: 500 })
  }
}
