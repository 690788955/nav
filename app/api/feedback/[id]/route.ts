import { NextRequest, NextResponse } from "next/server"
import { deleteFeedback } from "@/lib/actions/feedback"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await deleteFeedback(id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Unauthorized' ? 403 : 500 })
  }
  
  return NextResponse.json(result)
}
