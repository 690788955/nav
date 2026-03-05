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

  const id = type === "site" ? siteId! : feedbackId!

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (loading) return

    const wasLiked = isLiked(id, type)
    toggleLike(id, type)

    setLoading(true)
    try {
      const endpoint = type === "site" 
        ? `/api/likes/site/${id}` 
        : `/api/likes/feedback/${id}`
      
      const response = await fetch(endpoint, {
        method: wasLiked ? 'DELETE' : 'POST',
      })

      const result = await response.json()
      if (result.success && result.likesCount !== undefined) {
        setLikesCount(result.likesCount)
      }
    } catch (error) {
      console.error('Failed to update like:', error)
      // Revert on error
      toggleLike(id, type)
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
