"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/use-favorites"

interface FavoriteButtonProps {
  siteId: string
}

export function FavoriteButton({ siteId }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite, mounted } = useFavorites()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    toggleFavorite(siteId)
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Heart className="h-4 w-4" />
      </Button>
    )
  }

  const favorited = isFavorite(siteId)

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className={favorited ? "text-red-500" : ""}
    >
      <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
    </Button>
  )
}
