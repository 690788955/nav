"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createSite, updateSite, getAllCategories } from "@/lib/actions"
import { fetchSiteMetadata } from "@/lib/actions/metadata"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles } from "lucide-react"

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  categoryId: string
  isPublished: boolean
  platforms?: string | string[] | null
  screenshots?: string | string[] | null
  useCases?: string | null
}

interface Category {
  id: string
  name: string
}

const PLATFORMS = ["Web", "Desktop", "Mobile", "API"]

interface SiteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: Site | null
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function SiteFormDialog({ open, onOpenChange, site, mode, onSuccess }: SiteFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    iconUrl: "",
    categoryId: "",
    isPublished: false,
    platforms: [] as string[],
    screenshots: [] as string[],
    useCases: "",
  })

  const parseJsonArray = (value?: string | string[] | null) => {
    if (!value) {
      return []
    }

    if (Array.isArray(value)) {
      return value
    }

    try {
      const parsed = JSON.parse(value || "[]")
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // 加载分类列表
  useEffect(() => {
    async function loadCategories() {
      const result = await getAllCategories()
      if (result.success && result.data) {
        setCategories(result.data)
        if (result.data.length > 0) {
          setFormData(prev => (prev.categoryId ? prev : { ...prev, categoryId: result.data[0].id }))
        }
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (mode === "edit" && site) {
      setFormData({
        name: site.name,
        url: site.url,
        description: site.description,
        iconUrl: site.iconUrl || "",
        categoryId: site.categoryId,
        isPublished: site.isPublished,
        platforms: parseJsonArray(site.platforms),
        screenshots: parseJsonArray(site.screenshots),
        useCases: site.useCases || "",
      })
    } else if (mode === "create") {
      setFormData({
        name: "",
        url: "",
        description: "",
        iconUrl: "",
        categoryId: "",
        isPublished: false,
        platforms: [],
        screenshots: [],
        useCases: "",
      })
    }
  }, [site, mode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        platforms: JSON.stringify(formData.platforms),
        screenshots: JSON.stringify(formData.screenshots),
      }

      const actionPayload = submitData as unknown as Parameters<typeof createSite>[0]

      const result = mode === "create"
        ? await createSite(actionPayload)
        : await updateSite(site!.id, actionPayload)

      if (result.success) {
        toast({
          title: mode === "create" ? "创建成功" : "更新成功",
          description: `网站"${formData.name}"已${mode === "create" ? "创建" : "更新"}`,
        })
        onOpenChange(false)
        onSuccess?.()
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.error || "操作失败，请稍后重试",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "操作失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新增网站" : "编辑网站"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "添加一个新的网站到导航" : "修改网站信息"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">网站名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：Google"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">网站链接 *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fetching || !formData.url}
                onClick={async () => {
                  setFetching(true)
                  try {
                    const result = await fetchSiteMetadata(formData.url)
                    if (result.success && result.data) {
                      // Smart fill: only fill empty fields
                      setFormData(prev => ({
                        ...prev,
                        name: prev.name || result.data!.title || "",
                        description: prev.description || result.data!.description || "",
                        iconUrl: prev.iconUrl || result.data!.iconUrl || "",
                      }))
                    }
                  } catch (error) {
                    console.error("Failed to fetch metadata:", error)
                  } finally {
                    setFetching(false)
                  }
                }}
                className="w-fit"
              >
                {fetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    获取中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    自动填充
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">分类 *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">描述 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简短描述这个网站..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>平台</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!formData.platforms.includes(value)) {
                    setFormData({ ...formData, platforms: [...formData.platforms, value] })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择平台" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.platforms.map((platform, index) => (
                    <Badge key={`${platform}-${index}`} variant="secondary" className="gap-1">
                      {platform}
                      <button
                        type="button"
                        className="text-xs"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            platforms: formData.platforms.filter((_, i) => i !== index),
                          })
                        }}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>截图 URL</Label>
              {formData.screenshots.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const updatedScreenshots = [...formData.screenshots]
                      updatedScreenshots[index] = e.target.value
                      setFormData({ ...formData, screenshots: updatedScreenshots })
                    }}
                    placeholder="https://example.com/screenshot.png"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        screenshots: formData.screenshots.filter((_, i) => i !== index),
                      })
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  setFormData({ ...formData, screenshots: [...formData.screenshots, ""] })
                }}
              >
                + 添加截图
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="useCases">使用场景</Label>
              <Textarea
                id="useCases"
                value={formData.useCases}
                onChange={(e) => setFormData({ ...formData, useCases: e.target.value })}
                placeholder="描述这个网站适用于哪些场景..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="iconUrl">图标 URL</Label>
              <Input
                id="iconUrl"
                type="url"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="published">发布状态</Label>
                <p className="text-sm text-muted-foreground">
                  是否在前台显示此网站
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading || fetching}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
