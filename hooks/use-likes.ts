import { useState, useEffect } from "react"

const LIKED_SITES_KEY = "liked-sites"
const LIKED_FEEDBACKS_KEY = "liked-feedbacks"

export function useLikes() {
  const [likedSites, setLikedSites] = useState<Set<string>>(new Set())
  const [likedFeedbacks, setLikedFeedbacks] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedSites = localStorage.getItem(LIKED_SITES_KEY)
      const savedFeedbacks = localStorage.getItem(LIKED_FEEDBACKS_KEY)

      if (savedSites) {
        try {
          const parsed = JSON.parse(savedSites)
          setLikedSites(new Set(Array.isArray(parsed) ? parsed : []))
        } catch {
          setLikedSites(new Set())
        }
      }

      if (savedFeedbacks) {
        try {
          const parsed = JSON.parse(savedFeedbacks)
          setLikedFeedbacks(new Set(Array.isArray(parsed) ? parsed : []))
        } catch {
          setLikedFeedbacks(new Set())
        }
      }
    } catch {
      // localStorage unavailable, fallback to memory state
      setLikedSites(new Set())
      setLikedFeedbacks(new Set())
    }

    setMounted(true)
  }, [])

  // Toggle like for site or feedback
  const toggleLike = (type: "site" | "feedback", id: string) => {
    try {
      if (type === "site") {
        setLikedSites((prev) => {
          const updated = new Set(prev)
          if (updated.has(id)) {
            updated.delete(id)
          } else {
            updated.add(id)
          }
          // Persist to localStorage
          try {
            localStorage.setItem(LIKED_SITES_KEY, JSON.stringify(Array.from(updated)))
          } catch {
            // localStorage quota exceeded or unavailable, keep in memory
          }
          return updated
        })
      } else if (type === "feedback") {
        setLikedFeedbacks((prev) => {
          const updated = new Set(prev)
          if (updated.has(id)) {
            updated.delete(id)
          } else {
            updated.add(id)
          }
          // Persist to localStorage
          try {
            localStorage.setItem(LIKED_FEEDBACKS_KEY, JSON.stringify(Array.from(updated)))
          } catch {
            // localStorage quota exceeded or unavailable, keep in memory
          }
          return updated
        })
      }
    } catch {
      // Silently fail, state remains in memory
    }
  }

  // Check if item is liked
  const isLiked = (type: "site" | "feedback", id: string): boolean => {
    if (type === "site") {
      return likedSites.has(id)
    } else if (type === "feedback") {
      return likedFeedbacks.has(id)
    }
    return false
  }

  return {
    likedSites,
    likedFeedbacks,
    toggleLike,
    isLiked,
    mounted,
  }
}
