import { NextRequest, NextResponse } from "next/server"
import { likeFeedback, unlikeFeedback } from "@/lib/actions/likes"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await likeFeedback(id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  return NextResponse.json(result)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await unlikeFeedback(id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  return NextResponse.json(result)
}
