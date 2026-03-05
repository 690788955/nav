import { NextRequest, NextResponse } from "next/server"
import { deleteFeedback } from "@/lib/actions/feedback"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "Feedback ID is required" }, { status: 400 })
    }

    const result = await deleteFeedback(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return NextResponse.json({ success: false, error: "Failed to delete feedback" }, { status: 500 })
  }
}
