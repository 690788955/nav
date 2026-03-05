import { NextRequest, NextResponse } from "next/server"
import { submitFeedback, getFeedbacks } from "@/lib/actions/feedback"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('toolId') || undefined
  const type = searchParams.get('type') || undefined
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined
  const sortBy = (searchParams.get('sortBy') as 'likes' | 'time') || undefined

  const result = await getFeedbacks({ toolId, type, page, pageSize, sortBy })
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await submitFeedback(body)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.error?.includes('频繁') ? 429 : 400 })
  }
  
  return NextResponse.json(result, { status: 201 })
}
