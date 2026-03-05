import { useState, useEffect } from "react"

const FAVORITES_KEY = "favorites"

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      setFavorites(saved ? JSON.parse(saved) : [])
    } catch {
      // JSON parse failed or localStorage unavailable
      setFavorites([])
    }
    setMounted(true)
  }, [])

  const toggleFavorite = (id: string) => {
    try {
      const updated = favorites.includes(id)
        ? favorites.filter(fav => fav !== id)
        : [...favorites, id]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
      setFavorites(updated)
    } catch {
      // localStorage unavailable - update state only (in-memory fallback)
      const updated = favorites.includes(id)
        ? favorites.filter(fav => fav !== id)
        : [...favorites, id]
      setFavorites(updated)
    }
  }

  const isFavorite = (id: string): boolean => {
    return favorites.includes(id)
  }

  return { favorites, toggleFavorite, isFavorite, mounted }
}
