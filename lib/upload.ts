import path from "path"
import fs from "fs/promises"

/** 允许上传的图片 MIME 类型 */
export const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/webp",
  "image/vnd.microsoft.icon",
])

/** 文件大小上限：2MB */
export const MAX_FILE_SIZE = 2 * 1024 * 1024

/** MIME → 扩展名映射 */
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/webp": "webp",
  "image/vnd.microsoft.icon": "ico",
}

/** 扩展名 → Content-Type 映射 */
const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  webp: "image/webp",
}

/** 获取上传目录的绝对路径，自动创建目录 */
export async function getUploadDir(): Promise<string> {
  const dir = path.join(process.cwd(), "data", "uploads")
  await fs.mkdir(dir, { recursive: true })
  return dir
}

/** 根据 MIME 类型获取文件扩展名 */
export function getExtFromMime(mime: string): string | undefined {
  return MIME_TO_EXT[mime]
}

/** 根据文件扩展名获取 Content-Type */
export function getContentType(ext: string): string {
  return EXT_TO_CONTENT_TYPE[ext.toLowerCase()] || "application/octet-stream"
}
