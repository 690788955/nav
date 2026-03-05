"use server"

import { prisma } from "@/lib/prisma"

export async function likeSite(id: string) {
  try {
    const site = await prisma.site.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    })
    return { success: true, likesCount: site.likesCount }
  } catch (error) {
    console.error("Error liking site:", error)
    return { success: false, error: "Failed to like site" }
  }
}

export async function unlikeSite(id: string) {
  try {
    const site = await prisma.site.findUnique({ where: { id } })
    if (!site) {
      return { success: false, error: "Site not found" }
    }

    const updated = await prisma.site.update({
      where: { id },
      data: { likesCount: site.likesCount > 0 ? { decrement: 1 } : undefined },
    })
    return { success: true, likesCount: updated.likesCount }
  } catch (error) {
    console.error("Error unliking site:", error)
    return { success: false, error: "Failed to unlike site" }
  }
}

export async function likeFeedback(id: string) {
  try {
    const feedback = await prisma.feedback.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    })
    return { success: true, likesCount: feedback.likesCount }
  } catch (error) {
    console.error("Error liking feedback:", error)
    return { success: false, error: "Failed to like feedback" }
  }
}

export async function unlikeFeedback(id: string) {
  try {
    const feedback = await prisma.feedback.findUnique({ where: { id } })
    if (!feedback) {
      return { success: false, error: "Feedback not found" }
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: { likesCount: feedback.likesCount > 0 ? { decrement: 1 } : undefined },
    })
    return { success: true, likesCount: updated.likesCount }
  } catch (error) {
    console.error("Error unliking feedback:", error)
    return { success: false, error: "Failed to unlike feedback" }
  }
}
