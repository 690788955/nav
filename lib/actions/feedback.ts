"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers, cookies } from "next/headers"
import { getClientIp } from "@/lib/utils/ip"
import { checkRateLimit } from "@/lib/utils/rate-limit"

const FEEDBACK_TYPES = ['feature_request', 'bug_report', 'improvement'] as const

export async function submitFeedback(data: {
  toolId: string
  type: string
  content: string
  contact?: string
}) {
  try {
    // Validate type
    if (!FEEDBACK_TYPES.includes(data.type as any)) {
      return { success: false, error: "Invalid feedback type" }
    }

    // Validate content
    if (!data.content || data.content.trim().length === 0) {
      return { success: false, error: "Content is required" }
    }

    // Get client IP
    const headersList = await headers()
    const ip = getClientIp(headersList) || 'unknown'

    // Rate limit check: 5 feedback per IP per day
    const allowed = checkRateLimit(ip, 'feedback', 5, 24 * 60 * 60 * 1000)
    if (!allowed) {
      return { success: false, error: "提交太频繁，每天最多5条反馈" }
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        toolId: data.toolId,
        type: data.type,
        content: data.content.trim(),
        contact: data.contact?.trim() || null,
        ipAddress: ip,
      },
      include: {
        tool: {
          select: { id: true, name: true, url: true },
        },
      },
    })

    revalidatePath("/feedback")
    revalidatePath("/admin/feedback")

    return { success: true, data: feedback }
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return { success: false, error: "Failed to submit feedback" }
  }
}

export async function getFeedbacks(params?: {
  toolId?: string
  type?: string
  page?: number
  pageSize?: number
  sortBy?: 'likes' | 'time'
}) {
  try {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const skip = (page - 1) * pageSize

    const where: any = {
      isDeleted: false,
    }

    if (params?.toolId) {
      where.toolId = params.toolId
    }

    if (params?.type) {
      where.type = params.type
    }

    const orderBy = params?.sortBy === 'likes'
      ? { likesCount: 'desc' as const }
      : { createdAt: 'desc' as const }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          tool: {
            select: { id: true, name: true, url: true },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ])

    return {
      success: true,
      data: feedbacks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching feedbacks:", error)
    return { success: false, error: "Failed to fetch feedbacks" }
  }
}

export async function deleteFeedback(id: string) {
  try {
    // Check admin auth
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user_role')?.value

    if (userRole !== 'ADMIN') {
      return { success: false, error: "Unauthorized" }
    }

    // Soft delete
    await prisma.feedback.update({
      where: { id },
      data: { isDeleted: true },
    })

    revalidatePath("/feedback")
    revalidatePath("/admin/feedback")

    return { success: true }
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return { success: false, error: "Failed to delete feedback" }
  }
}
