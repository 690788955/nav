import { NextRequest, NextResponse } from "next/server"
import { likeSite, unlikeSite } from "@/lib/actions/likes"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await likeSite(params.id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  return NextResponse.json(result)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await unlikeSite(params.id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  return NextResponse.json(result)
}
