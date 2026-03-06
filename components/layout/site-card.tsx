"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { ExternalLink, Heart, ThumbsUp, MessageSquare, Loader2 } from "lucide-react"
import { useFaviconService, getFaviconUrl } from "@/hooks/use-favicon-service"
import { useFavorites } from "@/hooks/use-favorites"
import { useLikes } from "@/hooks/use-likes"
import { Button } from "@/components/ui/button"
import { FeedbackDialog } from "@/components/layout/feedback-dialog"

// 生成首字母图标（shadcn/ui 简洁风格）
function getInitialIcon(name: string) {
  const trimmed = name.trim()
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]
    const code = char.codePointAt(0) || 0

    // 匹配：英文字母 (A-Z, a-z) 或 中文字符 (0x4e00-0x9fff)
    const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
    const isChinese = code >= 0x4e00 && code <= 0x9fff

    if (isLetter || isChinese) {
      return char.toUpperCase()
    }
  }

  // 如果没有找到合适的字符，返回默认图标
  return 'N'
}

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  likesCount?: number
  category?: {
    name: string
  }
}

interface SiteCardProps {
  site: Site
}

export function SiteCard({ site }: SiteCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [likesCount, setLikesCount] = useState(site.likesCount ?? 0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [lastLikeTime, setLastLikeTime] = useState(0)
  const hasTriedLoad = useRef(false)
  const { service } = useFaviconService()
  const { toggleFavorite, isFavorite, mounted: favMounted } = useFavorites()
  const { toggleLike, isLiked, mounted: likeMounted } = useLikes()

  // 使用 useMemo 优化 favicon URL 计算
  // 优先级：用户配置 > 选中的 Favicon 服务
  const iconSrc = useMemo(() => {
    if (site.iconUrl) return site.iconUrl

    try {
      const domain = new URL(site.url).hostname
      // 使用选中的 Favicon 服务
      return getFaviconUrl(domain, service)
    } catch {
      return null
    }
  }, [site.iconUrl, site.url, service])

  // 计算首字母图标（作为 fallback）
  const initial = useMemo(() => getInitialIcon(site.name), [site.name])

  // 当服务切换时，重置加载状态
  useEffect(() => {
    setImageLoaded(false)
    hasTriedLoad.current = false
  }, [iconSrc])

  useEffect(() => {
    setLikesCount(site.likesCount ?? 0)
  }, [site.id, site.likesCount])

  // 使用 useEffect + new Image() 预加载图片
  useEffect(() => {
    if (!iconSrc || hasTriedLoad.current) return

    hasTriedLoad.current = true
    const img = new Image()

    img.onload = () => {
      setImageLoaded(true)
    }

    img.onerror = () => {
      // 保持显示首字母图标
    }

    img.src = iconSrc
  }, [iconSrc])

  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = event.target as HTMLElement

    // 卡片内操作按钮（收藏/点赞/反馈）不应触发外链跳转
    if (target.closest('[data-card-action="true"]')) {
      event.preventDefault()
      return
    }

    // 使用 sendBeacon 异步记录访问，不阻塞页面跳转
    if (navigator.sendBeacon) {
      const data = JSON.stringify({ siteId: site.id })
      navigator.sendBeacon('/api/visit', new Blob([data], { type: 'application/json' }))
    }
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    toggleFavorite(site.id)
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // 防抖：1秒内禁止重复点击
    const now = Date.now()
    if (now - lastLikeTime < 1000) return
    setLastLikeTime(now)

    if (likeLoading) return

    const wasLiked = isLiked(site.id, 'site')
    const delta = wasLiked ? -1 : 1

    toggleLike(site.id, 'site')
    setLikesCount((prev) => Math.max(0, prev + delta))
    setLikeLoading(true)

    try {
      const response = await fetch(`/api/likes/site/${site.id}`, {
        method: wasLiked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        throw new Error("Failed to update like status")
      }

      const result = await response.json()
      if (result.success && result.likesCount !== undefined) {
        setLikesCount(Math.max(0, result.likesCount))
      } else {
        throw new Error(result.error || "Failed to update like status")
      }
    } catch {
      toggleLike(site.id, 'site')
      setLikesCount((prev) => Math.max(0, prev - delta))
    } finally {
      setLikeLoading(false)
    }
  }

  return (
    <Link
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleCardClick}
        aria-label={`访问 ${site.name}`}
        className="group block"
    >
      <Card className="h-full transition-colors hover:bg-muted">
        <CardHeader>
          <CardAction>
            <div className="flex items-center gap-1">
              {favMounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-card-action="true"
                  onClick={handleFavorite}
                >
                  <Heart className={`h-4 w-4 ${isFavorite(site.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              )}
              {likeMounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-card-action="true"
                  onClick={handleLike}
                  disabled={likeLoading}
                >
                  {likeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className={`h-4 w-4 ${isLiked(site.id, 'site') ? 'fill-blue-500 text-blue-500' : ''}`} />
                  )}
                </Button>
              )}
              <FeedbackDialog toolId={site.id} toolName={site.name}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-card-action="true"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </FeedbackDialog>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardAction>
          <div className="flex items-center space-x-3">
            {iconSrc && imageLoaded ? (
              <img
                src={iconSrc}
                alt={`${site.name} 图标`}
                className="h-8 w-8 rounded"
              />
            ) : (
              <div
                className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground"
                title={site.name}
              >
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2 leading-tight" title={site.name}>{site.name}</CardTitle>
              {site.description && (
                <CardDescription className="mt-2 line-clamp-1" title={site.description}>
                  {site.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
