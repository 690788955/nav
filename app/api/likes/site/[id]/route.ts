import { NextRequest, NextResponse } from "next/server"
import { likeSite, unlikeSite } from "@/lib/actions/likes"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "Site ID is required" }, { status: 400 })
    }

    const result = await likeSite(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error liking site:", error)
    return NextResponse.json({ success: false, error: "Failed to like site" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "Site ID is required" }, { status: 400 })
    }

    const result = await unlikeSite(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error unliking site:", error)
    return NextResponse.json({ success: false, error: "Failed to unlike site" }, { status: 500 })
  }
}
