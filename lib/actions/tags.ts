"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { generateTagSlug } from "@/lib/utils"

export async function getTags(params?: {
  isOfficial?: boolean
  isApproved?: boolean
}) {
  try {
    const where: any = {}

    if (params?.isOfficial !== undefined) {
      where.isOfficial = params.isOfficial
    }

    if (params?.isApproved !== undefined) {
      where.isApproved = params.isApproved
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return { success: true, data: tags }
  } catch (error) {
    console.error("Error fetching tags:", error)
    return { success: false, error: "Failed to fetch tags" }
  }
}

export async function createTag(data: {
  name: string
  isOfficial?: boolean
}) {
  try {
    const slug = generateTagSlug(data.name)

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug,
        isOfficial: data.isOfficial || false,
        isApproved: data.isOfficial || false, // Official tags are auto-approved
      },
    })

    revalidatePath("/admin/tags")

    return { success: true, data: tag }
  } catch (error: any) {
    console.error("Error creating tag:", error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return { success: false, error: "Tag name or slug already exists" }
    }

    return { success: false, error: "Failed to create tag" }
  }
}

export async function updateTag(
  id: string,
  data: {
    name?: string
    isOfficial?: boolean
    isApproved?: boolean
  }
) {
  try {
    // Check admin auth
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user_role')?.value

    if (userRole !== 'ADMIN') {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: any = { ...data }

    // Regenerate slug if name changes
    if (data.name) {
      updateData.slug = generateTagSlug(data.name)
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/tags")

    return { success: true, data: tag }
  } catch (error: any) {
    console.error("Error updating tag:", error)

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return { success: false, error: "Tag name or slug already exists" }
    }

    return { success: false, error: "Failed to update tag" }
  }
}

export async function deleteTag(id: string) {
  try {
    // Check admin auth
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user_role')?.value

    if (userRole !== 'ADMIN') {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.tag.delete({
      where: { id },
    })

    revalidatePath("/admin/tags")

    return { success: true }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return { success: false, error: "Failed to delete tag" }
  }
}

export async function approveTag(id: string) {
  try {
    // Check admin auth
    const cookieStore = await cookies()
    const userRole = cookieStore.get('user_role')?.value

    if (userRole !== 'ADMIN') {
      return { success: false, error: "Unauthorized" }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { isApproved: true },
    })

    revalidatePath("/admin/tags")

    return { success: true, data: tag }
  } catch (error) {
    console.error("Error approving tag:", error)
    return { success: false, error: "Failed to approve tag" }
  }
}
