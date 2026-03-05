"use client"

import { useFavorites } from "@/hooks/use-favorites"
import { SiteCard } from "@/components/layout/site-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart } from "lucide-react"
import { useEffect, useState } from "react"

export default function FavoritesPage() {
  const { favorites, mounted } = useFavorites()
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mounted || favorites.length === 0) {
      setLoading(false)
      return
    }

    async function loadSites() {
      try {
        const promises = favorites.map(id =>
          fetch(`/api/sites/${id}`).then(r => r.json())
        )
        const results = await Promise.all(promises)
        setSites(results.filter(r => r.success).map(r => r.data))
      } catch (error) {
        console.error('Failed to load favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSites()
  }, [favorites, mounted])

  if (!mounted || loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Heart className="mr-2 h-8 w-8" />
          我的收藏
        </h1>
        <p className="text-muted-foreground mt-2">
          {favorites.length} 个工具
        </p>
      </div>

      {sites.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>暂无收藏</CardTitle>
            <CardDescription>
              浏览工具时点击收藏按钮，将工具添加到这里
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
