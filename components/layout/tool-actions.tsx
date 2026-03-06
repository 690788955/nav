"use client"

import { FavoriteButton } from "@/components/layout/favorite-button"
import { LikeButton } from "@/components/layout/like-button"
import { FeedbackDialog } from "@/components/layout/feedback-dialog"

interface ToolActionsProps {
  siteId: string
  siteName: string
  likesCount: number
}

export function ToolActions({ siteId, siteName, likesCount }: ToolActionsProps) {
  return (
    <>
      <FavoriteButton siteId={siteId} />
      <LikeButton siteId={siteId} initialCount={likesCount} type="site" />
      <FeedbackDialog toolId={siteId} toolName={siteName} />
    </>
  )
}
