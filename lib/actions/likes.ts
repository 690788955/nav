"use server"

import { prisma } from "@/lib/prisma"

export async function likeSite(id: string) {
  try {
    const site = await prisma.site.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    })
    return { success: true, likesCount: site.likesCount }
  } catch (error) {
    console.error("Error liking site:", error)
    return { success: false, error: "Failed to like site" }
  }
}

export async function unlikeSite(id: string) {
  try {
    // 原子条件更新，避免并发下出现负数或重复扣减
    await prisma.site.updateMany({
      where: {
        id,
        likesCount: {
          gt: 0,
        },
      },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    })

    const site = await prisma.site.findUnique({
      where: { id },
      select: { likesCount: true },
    })

    if (!site) {
      return { success: false, error: "Site not found" }
    }

    return { success: true, likesCount: site.likesCount }
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
      select: { likesCount: true },
    })
    return { success: true, likesCount: feedback.likesCount }
  } catch (error) {
    console.error("Error liking feedback:", error)
    return { success: false, error: "Failed to like feedback" }
  }
}

export async function unlikeFeedback(id: string) {
  try {
    // 原子条件更新，避免并发下出现负数或重复扣减
    await prisma.feedback.updateMany({
      where: {
        id,
        likesCount: {
          gt: 0,
        },
      },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    })

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { likesCount: true },
    })

    if (!feedback) {
      return { success: false, error: "Feedback not found" }
    }

    return { success: true, likesCount: feedback.likesCount }
  } catch (error) {
    console.error("Error unliking feedback:", error)
    return { success: false, error: "Failed to unlike feedback" }
  }
}
