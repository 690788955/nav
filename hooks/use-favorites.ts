"use client"

import { useState, useEffect } from "react"

const FAVORITES_KEY = "favorites"

export default function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      if (saved) {
        try {
          setFavorites(JSON.parse(saved))
        } catch {
          // JSON parse error - reset to empty array
          setFavorites([])
          localStorage.setItem(FAVORITES_KEY, JSON.stringify([]))
        }
      } else {
        setFavorites([])
      }
    } catch {
      // localStorage unavailable - fallback to memory state
      setFavorites([])
    }
    setMounted(true)
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((fav) => fav !== id)
        : [...prev, id]

      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
      } catch {
        // localStorage unavailable - continue with memory state
      }

      return updated
    })
  }

  const isFavorite = (id: string) => favorites.includes(id)

  return { favorites, toggleFavorite, isFavorite, mounted }
}
