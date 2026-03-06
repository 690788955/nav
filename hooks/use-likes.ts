import { useState, useEffect } from "react"

const LIKED_SITES_KEY = "liked-sites"
const LIKED_FEEDBACKS_KEY = "liked-feedbacks"
const LIKES_SYNC_EVENT = "nav:likes-sync"

function parseStoredLikes(raw: string | null): Set<string> {
  if (!raw) {
    return new Set()
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return new Set()
    }

    const values = parsed.filter((item): item is string => typeof item === "string")
    return new Set(values)
  } catch {
    return new Set()
  }
}

export function useLikes() {
  const [likedSites, setLikedSites] = useState<Set<string>>(new Set())
  const [likedFeedbacks, setLikedFeedbacks] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedSites = localStorage.getItem(LIKED_SITES_KEY)
      const savedFeedbacks = localStorage.getItem(LIKED_FEEDBACKS_KEY)

      setLikedSites(parseStoredLikes(savedSites))
      setLikedFeedbacks(parseStoredLikes(savedFeedbacks))
    } catch {
      // JSON parse failed or localStorage unavailable - use empty sets
      setLikedSites(new Set())
      setLikedFeedbacks(new Set())
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LIKED_SITES_KEY) {
        setLikedSites(parseStoredLikes(event.newValue))
        return
      }

      if (event.key === LIKED_FEEDBACKS_KEY) {
        setLikedFeedbacks(parseStoredLikes(event.newValue))
      }
    }

    const handleLikesSync = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: "site" | "feedback"
        values: string[]
      }>

      const values = Array.isArray(customEvent.detail?.values)
        ? customEvent.detail.values.filter((item): item is string => typeof item === "string")
        : []

      if (customEvent.detail?.type === "site") {
        setLikedSites(new Set(values))
        return
      }

      if (customEvent.detail?.type === "feedback") {
        setLikedFeedbacks(new Set(values))
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(LIKES_SYNC_EVENT, handleLikesSync)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(LIKES_SYNC_EVENT, handleLikesSync)
    }
  }, [])

  const toggleLike = (id: string, type: "site" | "feedback") => {
    try {
      const key = type === "site" ? LIKED_SITES_KEY : LIKED_FEEDBACKS_KEY
      const currentSet = parseStoredLikes(localStorage.getItem(key))
      const newSet = new Set(currentSet)

      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }

      const values = Array.from(newSet)
      localStorage.setItem(key, JSON.stringify(values))

      if (type === "site") {
        setLikedSites(newSet)
      } else {
        setLikedFeedbacks(newSet)
      }

      window.dispatchEvent(
        new CustomEvent<{
          type: "site" | "feedback"
          values: string[]
        }>(LIKES_SYNC_EVENT, {
          detail: { type, values },
        })
      )
    } catch {
      // localStorage unavailable - update state only (in-memory fallback)
      if (type === "site") {
        setLikedSites((prev) => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
      } else {
        setLikedFeedbacks((prev) => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
      }
    }
  }

  const isLiked = (id: string, type: "site" | "feedback"): boolean => {
    return type === "site" ? likedSites.has(id) : likedFeedbacks.has(id)
  }

  return {
    likedSites,
    likedFeedbacks,
    toggleLike,
    isLiked,
    mounted,
  }
}
