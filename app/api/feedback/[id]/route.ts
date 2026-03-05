import { NextRequest, NextResponse } from "next/server"
import { deleteFeedback } from "@/lib/actions/feedback"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await deleteFeedback(params.id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Unauthorized' ? 403 : 500 })
  }
  
  return NextResponse.json(result)
}
