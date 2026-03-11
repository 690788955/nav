import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { getUploadDir, ALLOWED_TYPES, MAX_FILE_SIZE, getExtFromMime } from "@/lib/upload"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 })
    }

    // 校验文件类型
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件类型，仅允许 PNG、JPG、GIF、SVG、ICO、WebP" },
        { status: 400 }
      )
    }

    // 校验文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小超过 2MB 限制" },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const ext = getExtFromMime(file.type) || "png"
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${random}.${ext}`

    // 写入文件
    const uploadDir = await getUploadDir()
    const filePath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({ url: `/api/uploads/${filename}` })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "上传失败" }, { status: 500 })
  }
}
