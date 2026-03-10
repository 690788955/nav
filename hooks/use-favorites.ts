import { useState, useEffect } from "react"

const FAVORITES_KEY = "favorites"
const FAVORITES_SYNC_EVENT = "nav:favorites-sync"

function parseFavorites(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is string => typeof item === "string")
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const syncRemoteFavorites = async (values: string[]) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ favorites: values }),
      })

      if (!response.ok) {
        throw new Error("Failed to sync favorites")
      }

      const payload = await response.json()
      return Array.isArray(payload?.favorites)
        ? payload.favorites.filter((item: unknown): item is string => typeof item === "string")
        : values
    } catch {
      // Ignore remote sync failures, local state remains source of truth in current session
      return values
    }
  }

  // Initialize from localStorage
  useEffect(() => {
    let cancelled = false

    const initializeFavorites = async () => {
      const local = (() => {
        try {
          return parseFavorites(localStorage.getItem(FAVORITES_KEY))
        } catch {
          return []
        }
      })()

      if (!cancelled) {
        setFavorites(local)
      }

      try {
        const response = await fetch("/api/favorites")
        if (!response.ok) {
          throw new Error("Failed to fetch favorites")
        }

        const payload = await response.json()
        const remote = Array.isArray(payload?.favorites)
          ? payload.favorites.filter((item: unknown): item is string => typeof item === "string")
          : []

        const merged = Array.from(new Set([...remote, ...local]))

        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged))
        } catch {
          // localStorage unavailable
        }

        if (!cancelled) {
          setFavorites(merged)
        }

        if (merged.length !== remote.length || merged.some((id, index) => id !== remote[index])) {
          const canonical = await syncRemoteFavorites(merged)

          try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(canonical))
          } catch {
            // localStorage unavailable
          }

          if (!cancelled) {
            setFavorites(canonical)
          }
        }
      } catch {
        // Keep local favorites when remote is unavailable
      } finally {
        if (!cancelled) {
          setMounted(true)
        }
      }
    }

    void initializeFavorites()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== FAVORITES_KEY) {
        return
      }

      setFavorites(parseFavorites(event.newValue))
    }

    const handleFavoritesSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ values: string[] }>
      setFavorites(Array.isArray(customEvent.detail?.values) ? customEvent.detail.values : [])
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(FAVORITES_SYNC_EVENT, handleFavoritesSync)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(FAVORITES_SYNC_EVENT, handleFavoritesSync)
    }
  }, [])

  const toggleFavorite = (id: string) => {
    try {
      const snapshot = parseFavorites(localStorage.getItem(FAVORITES_KEY))
      const updated = snapshot.includes(id)
        ? snapshot.filter(fav => fav !== id)
        : [...snapshot, id]

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
      setFavorites(updated)
      void syncRemoteFavorites(updated).then((canonical) => {
        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(canonical))
        } catch {
          // localStorage unavailable
        }

        setFavorites(canonical)

        window.dispatchEvent(
          new CustomEvent<{ values: string[] }>(FAVORITES_SYNC_EVENT, {
            detail: { values: canonical },
          })
        )
      })

      window.dispatchEvent(
        new CustomEvent<{ values: string[] }>(FAVORITES_SYNC_EVENT, {
          detail: { values: updated },
        })
      )
    } catch {
      // localStorage unavailable - update state only (in-memory fallback)
      setFavorites((prev) => {
        const updated = prev.includes(id)
          ? prev.filter((fav) => fav !== id)
          : [...prev, id]

        void syncRemoteFavorites(updated).then((canonical) => {
          setFavorites(canonical)
        })
        return updated
      })
    }
  }

  const isFavorite = (id: string): boolean => {
    return favorites.includes(id)
  }

  return { favorites, toggleFavorite, isFavorite, mounted }
}
