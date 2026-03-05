import { useState, useEffect } from "react"

const LIKED_SITES_KEY = "liked-sites"
const LIKED_FEEDBACKS_KEY = "liked-feedbacks"

export function useLikes() {
  const [likedSites, setLikedSites] = useState<Set<string>>(new Set())
  const [likedFeedbacks, setLikedFeedbacks] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedSites = localStorage.getItem(LIKED_SITES_KEY)
      const savedFeedbacks = localStorage.getItem(LIKED_FEEDBACKS_KEY)

      setLikedSites(
        savedSites ? new Set(JSON.parse(savedSites)) : new Set()
      )
      setLikedFeedbacks(
        savedFeedbacks ? new Set(JSON.parse(savedFeedbacks)) : new Set()
      )
    } catch {
      // JSON parse failed or localStorage unavailable - use empty sets
      setLikedSites(new Set())
      setLikedFeedbacks(new Set())
    }
    setMounted(true)
  }, [])

  const toggleLike = (id: string, type: "site" | "feedback") => {
    try {
      const targetSet = type === "site" ? likedSites : likedFeedbacks
      const newSet = new Set(targetSet)

      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }

      const key = type === "site" ? LIKED_SITES_KEY : LIKED_FEEDBACKS_KEY
      localStorage.setItem(key, JSON.stringify(Array.from(newSet)))

      if (type === "site") {
        setLikedSites(newSet)
      } else {
        setLikedFeedbacks(newSet)
      }
    } catch {
      // localStorage unavailable - update state only (in-memory fallback)
      const newSet = new Set(
        type === "site" ? likedSites : likedFeedbacks
      )
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }

      if (type === "site") {
        setLikedSites(newSet)
      } else {
        setLikedFeedbacks(newSet)
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
