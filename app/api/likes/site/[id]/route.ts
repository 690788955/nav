import { NextRequest, NextResponse } from "next/server"
import { likeSite, unlikeSite } from "@/lib/actions/likes"
import { checkRateLimit } from "@/lib/utils/rate-limit"

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = getClientIp(request)

  // IP限流：同一IP对同一目标10秒内只能操作一次
  if (!checkRateLimit(ip, `like:site:${id}`, 1, 10000)) {
    return NextResponse.json(
      { success: false, error: "操作过于频繁，请稍后再试" },
      { status: 429 }
    )
  }

  const result = await likeSite(id)
  
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
  const ip = getClientIp(request)

  // IP限流：同一IP对同一目标10秒内只能操作一次
  if (!checkRateLimit(ip, `unlike:site:${id}`, 1, 10000)) {
    return NextResponse.json(
      { success: false, error: "操作过于频繁，请稍后再试" },
      { status: 429 }
    )
  }

  const result = await unlikeSite(id)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  return NextResponse.json(result)
}
