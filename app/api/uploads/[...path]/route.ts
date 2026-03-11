import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { getUploadDir, getContentType } from "@/lib/upload"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params
    const filename = segments.join("/")

    // 防止路径遍历攻击
    if (filename.includes("..")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const uploadDir = await getUploadDir()
    const filePath = path.join(uploadDir, filename)

    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return new NextResponse("Not Found", { status: 404 })
    }

    const fileBuffer = await fs.readFile(filePath)
    const ext = path.extname(filename).slice(1)
    const contentType = getContentType(ext)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("File serve error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
