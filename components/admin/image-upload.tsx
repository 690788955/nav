"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  accept?: string
  placeholder?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  accept = "image/png,image/jpeg,image/gif,image/svg+xml,image/x-icon,image/webp",
  placeholder = "输入图片 URL 或点击上传",
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "上传失败")
      }

      onChange(data.url)
    } catch (error) {
      // 让调用方处理错误，或者简单提示
      console.error("Upload failed:", error)
      alert(error instanceof Error ? error.message : "上传失败")
    } finally {
      setUploading(false)
      // 重置 input 以便可以重复选择同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      {/* 缩略图预览 */}
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-10 w-10 rounded border object-cover shrink-0"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
          onLoad={(e) => {
            ;(e.target as HTMLImageElement).style.display = "block"
          }}
        />
      )}

      {/* URL 输入框 */}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />

      {/* 上传按钮 */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        title="上传图片"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>

      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
