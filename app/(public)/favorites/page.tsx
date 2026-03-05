"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SiteCard } from "@/components/layout/site-card"
import { Button } from "@/components/ui/button"
import useFavorites from "@/hooks/use-favorites"
import { getSites } from "@/lib/actions"

interface FavoriteSite {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  likesCount?: number
  isPublished: boolean
  category?: {
    name: string
  }
}

export default function FavoritesPage() {
  const { favorites, mounted } = useFavorites()
  const [favoriteSites, setFavoriteSites] = useState<FavoriteSite[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadFavoriteSites() {
      if (!mounted) {
        return
      }

      if (favorites.length === 0) {
        setFavoriteSites([])
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const result = await getSites()
        if (!result.success || !result.data || cancelled) {
          if (!cancelled) {
            setFavoriteSites([])
          }
          return
        }

        const favoriteSet = new Set(favorites)
        const matchedSites = result.data.filter(
          (site) => site.isPublished && favoriteSet.has(site.id)
        )

        if (!cancelled) {
          setFavoriteSites(matchedSites)
        }
      } catch {
        if (!cancelled) {
          setFavoriteSites([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFavoriteSites()

    return () => {
      cancelled = true
    }
  }, [favorites, mounted])

  const showEmptyState = useMemo(() => {
    if (!mounted || loading) return false
    return favorites.length === 0 || favoriteSites.length === 0
  }, [favorites.length, favoriteSites.length, loading, mounted])

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={[]} />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="mx-auto max-w-[1600px] w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">我的收藏</h1>
            <p className="text-muted-foreground mt-2">这里展示你收藏的所有工具</p>
          </div>

          {!mounted || loading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">正在加载收藏内容...</p>
            </div>
          ) : showEmptyState ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
              <Heart className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="mt-4 text-lg text-muted-foreground">还没有收藏任何工具</p>
              <p className="mt-2 text-sm text-muted-foreground">
                浏览首页并点击心形按钮来收藏喜欢的工具
              </p>
              <Button asChild className="mt-6">
                <Link href="/">去首页逛逛</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoriteSites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
