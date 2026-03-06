"use client"

import { useState } from "react"
import { ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLikes } from "@/hooks/use-likes"

interface LikeButtonProps {
  siteId?: string
  feedbackId?: string
  initialCount: number
  type: "site" | "feedback"
}

export function LikeButton({ siteId, feedbackId, initialCount, type }: LikeButtonProps) {
  const { toggleLike, isLiked, mounted } = useLikes()
  const [likesCount, setLikesCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [lastClickTime, setLastClickTime] = useState(0)

  const id = type === "site" ? siteId! : feedbackId!

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // 防抖：1秒内禁止重复点击
    const now = Date.now()
    if (now - lastClickTime < 1000) return
    setLastClickTime(now)

    if (loading) return

    const wasLiked = isLiked(id, type)
    const delta = wasLiked ? -1 : 1

    toggleLike(id, type)
    setLikesCount((prev) => Math.max(0, prev + delta))

    setLoading(true)
    try {
      const endpoint = type === "site" 
        ? `/api/likes/site/${id}` 
        : `/api/likes/feedback/${id}`
      
      const response = await fetch(endpoint, {
        method: wasLiked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        throw new Error("Failed to update like")
      }

      const result = await response.json()
      if (result.success && result.likesCount !== undefined) {
        setLikesCount(Math.max(0, result.likesCount))
      } else {
        throw new Error(result.error || "Failed to update like")
      }
    } catch (error) {
      console.error('Failed to update like:', error)
      // Revert on error
      toggleLike(id, type)
      setLikesCount((prev) => Math.max(0, prev - delta))
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ThumbsUp className="mr-1 h-4 w-4" />
        {likesCount}
      </Button>
    )
  }

  const liked = isLiked(id, type)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={liked ? "text-blue-500" : ""}
    >
      <ThumbsUp className="mr-1 h-4 w-4" fill={liked ? "currentColor" : "none"} />
      {likesCount}
    </Button>
  )
}
