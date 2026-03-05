"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SiteCard } from "@/components/layout/site-card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import useFavorites from "@/hooks/use-favorites"
import { getSites } from "@/lib/actions"

export default function FavoritesPage() {
  const { favorites, mounted } = useFavorites()
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mounted) return

    async function fetchFavorites() {
      if (favorites.length === 0) {
        setLoading(false)
        return
      }

      try {
        const { data } = await getSites()
        if (data) {
          const favoriteSites = data.filter(site => favorites.includes(site.id))
          setSites(favoriteSites)
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [favorites, mounted])

  if (!mounted || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">我的收藏</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (favorites.length === 0 || sites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">我的收藏</h1>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Heart className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">还没有收藏任何工具</h2>
          <p className="text-muted-foreground text-center max-w-md">
            浏览首页并点击心形按钮来收藏喜欢的工具
          </p>
          <Button asChild className="mt-4">
            <Link href="/">去首页逛逛</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">我的收藏</h1>
        <p className="text-muted-foreground mt-2">
          共收藏 {sites.length} 个工具
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sites.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </div>
  )
}
