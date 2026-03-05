"use server"

import { Prisma } from "@prisma/client"
import { cookies, headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getClientIp } from "@/lib/utils/ip"
import { checkRateLimit } from "@/lib/utils/rate-limit"

type FeedbackType = "feature_request" | "bug_report" | "improvement"

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

const VALID_FEEDBACK_TYPES: FeedbackType[] = [
  "feature_request",
  "bug_report",
  "improvement",
]

async function ensureAdmin(): Promise<ActionResult> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId || userRole !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  return { success: true }
}

export async function submitFeedback(data: {
  toolId: string
  type: string
  content: string
  contact?: string
}): Promise<ActionResult> {
  try {
    if (!data.toolId) {
      return { success: false, error: "Tool ID is required" }
    }

    if (!data.content?.trim()) {
      return { success: false, error: "Feedback content is required" }
    }

    if (!VALID_FEEDBACK_TYPES.includes(data.type as FeedbackType)) {
      return {
        success: false,
        error: "Invalid feedback type. Must be feature_request, bug_report, or improvement",
      }
    }

    const requestHeaders = await headers()
    const clientIp = getClientIp(requestHeaders) ?? "unknown"

    const allowed = checkRateLimit(clientIp, "feedback", 5, 86400000)
    if (!allowed) {
      return {
        success: false,
        error: "Too many feedback submissions. Please try again tomorrow.",
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        toolId: data.toolId,
        type: data.type,
        content: data.content.trim(),
        contact: data.contact?.trim() || null,
        ipAddress: clientIp,
      },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return { success: true, data: feedback }
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return { success: false, error: "Failed to submit feedback" }
  }
}

export async function getFeedbacks(params: {
  toolId?: string
  type?: FeedbackType
  page?: number
  pageSize?: number
  sortBy?: "likes" | "time"
}): Promise<ActionResult> {
  try {
    const page = Math.max(1, params.page || 1)
    const pageSize = Math.max(1, params.pageSize || 10)
    const skip = (page - 1) * pageSize

    const where: Prisma.FeedbackWhereInput = {
      isDeleted: false,
    }

    if (params.toolId) {
      where.toolId = params.toolId
    }

    if (params.type) {
      if (!VALID_FEEDBACK_TYPES.includes(params.type)) {
        return {
          success: false,
          error: "Invalid feedback type filter",
        }
      }
      where.type = params.type
    }

    const orderBy: Prisma.FeedbackOrderByWithRelationInput =
      params.sortBy === "likes"
        ? { likesCount: "desc" }
        : { createdAt: "desc" }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          tool: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ])

    return {
      success: true,
      data: {
        items: feedbacks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching feedbacks:", error)
    return { success: false, error: "Failed to fetch feedbacks" }
  }
}

export async function deleteFeedback(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return { success: false, error: "Feedback ID is required" }
    }

    const adminCheck = await ensureAdmin()
    if (!adminCheck.success) {
      return adminCheck
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { isDeleted: true },
    })

    return { success: true, data: feedback }
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return { success: false, error: "Failed to delete feedback" }
  }
}

export async function likeFeedback(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return { success: false, error: "Feedback ID is required" }
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    })

    return { success: true, data: feedback }
  } catch (error) {
    console.error("Error liking feedback:", error)
    return { success: false, error: "Failed to like feedback" }
  }
}
