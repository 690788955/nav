"use client"

import { useFavorites } from "@/hooks/use-favorites"
import { SiteCard } from "@/components/layout/site-card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import { useMemo } from "react"

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  likesCount?: number
  tags?: string[] | string | null
  category?: { name: string }
}

interface FavoritesSectionProps {
  allSites: Site[]
}

export function FavoritesSection({ allSites }: FavoritesSectionProps) {
  const { favorites, mounted } = useFavorites()

  const favoriteSites = useMemo(() => {
    return allSites.filter(site => favorites.includes(site.id))
  }, [allSites, favorites])

  if (!mounted || favoriteSites.length === 0) {
    return null
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-6 w-6 fill-red-500 text-red-500" />
          我的收藏
        </h2>
        <Badge variant="secondary">{favoriteSites.length}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favoriteSites.map(site => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </section>
  )
}
