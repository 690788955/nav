"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, ThumbsUp } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"
import { useLikes } from "@/hooks/use-likes"

interface ToolActionsProps {
  site: {
    id: string
    name: string
    likesCount?: number
  }
}

export function ToolActions({ site }: ToolActionsProps) {
  const { toggleFavorite, isFavorite, mounted: favoritesMounted } = useFavorites()
  const { toggleLike, isLiked, mounted: likesMounted } = useLikes()
  const [likesCount, setLikesCount] = useState(site.likesCount ?? 0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [lastLikeTime, setLastLikeTime] = useState(0)

  const mounted = favoritesMounted && likesMounted
  const favoriteActive = mounted && isFavorite(site.id)
  const likedActive = mounted && isLiked(site.id, "site")

  const handleFavoriteClick = () => {
    toggleFavorite(site.id)
  }

  const handleLikeClick = async () => {
    // 防抖：1秒内禁止重复点击
    const now = Date.now()
    if (now - lastLikeTime < 1000) return
    setLastLikeTime(now)

    if (likeLoading) return

    const currentlyLiked = isLiked(site.id, "site")
    const delta = currentlyLiked ? -1 : 1

    toggleLike(site.id, "site")
    setLikesCount((prev) => Math.max(0, prev + delta))
    setLikeLoading(true)

    try {
      const response = await fetch(`/api/likes/site/${site.id}`, {
        method: currentlyLiked ? "DELETE" : "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to update like status")
      }

      const payload = await response.json()
      if (typeof payload?.likesCount === "number") {
        setLikesCount(Math.max(0, payload.likesCount))
      } else {
        throw new Error("Invalid likesCount payload")
      }
    } catch {
      toggleLike(site.id, "site")
      setLikesCount((prev) => Math.max(0, prev - delta))
    } finally {
      setLikeLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleFavoriteClick}
        className="gap-2"
      >
        <Heart className={`h-4 w-4 ${favoriteActive ? "fill-red-500 text-red-500" : ""}`} />
        {favoriteActive ? "已收藏" : "收藏"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLikeClick}
        className="gap-2"
        disabled={likeLoading}
      >
        <ThumbsUp className={`h-4 w-4 ${likedActive ? "fill-blue-500 text-blue-500" : ""}`} />
        {likesCount}
      </Button>
    </div>
  )
}
