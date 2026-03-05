"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { generateTagSlug } from "@/lib/utils"

type TagFilters = {
  isOfficial?: boolean
  isApproved?: boolean
}

type CreateTagData = {
  name: string
  isOfficial?: boolean
  isApproved?: boolean
}

type UpdateTagData = {
  name?: string
  isOfficial?: boolean
  isApproved?: boolean
}

async function isAdminUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId || userRole !== "ADMIN") {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role === "ADMIN"
}

export async function getTags(params: TagFilters = {}) {
  try {
    const where: TagFilters = {}

    if (params.isOfficial !== undefined) {
      where.isOfficial = params.isOfficial
    }

    if (params.isApproved !== undefined) {
      where.isApproved = params.isApproved
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
    })

    return { success: true, data: tags }
  } catch (error) {
    console.error("Error fetching tags:", error)
    return { success: false, error: "Failed to fetch tags" }
  }
}

export async function createTag(data: CreateTagData) {
  try {
    const admin = await isAdminUser()
    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug: generateTagSlug(data.name),
        isOfficial: admin ? (data.isOfficial ?? false) : false,
        isApproved: admin ? (data.isApproved ?? false) : false,
      },
    })

    revalidatePath("/admin/tags")
    revalidatePath("/")

    return { success: true, data: tag }
  } catch (error) {
    console.error("Error creating tag:", error)
    return { success: false, error: "Failed to create tag" }
  }
}

export async function updateTag(id: string, data: UpdateTagData) {
  try {
    const admin = await isAdminUser()
    if (!admin) {
      return { success: false, error: "Admin access required" }
    }

    const existingTag = await prisma.tag.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!existingTag) {
      return { success: false, error: "Tag not found" }
    }

    const updateData: UpdateTagData & { slug?: string } = {}

    if (data.name !== undefined) {
      updateData.name = data.name
      if (data.name !== existingTag.name) {
        updateData.slug = generateTagSlug(data.name)
      }
    }

    if (data.isOfficial !== undefined) {
      updateData.isOfficial = data.isOfficial
    }

    if (data.isApproved !== undefined) {
      updateData.isApproved = data.isApproved
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/tags")
    revalidatePath("/")

    return { success: true, data: tag }
  } catch (error) {
    console.error("Error updating tag:", error)
    return { success: false, error: "Failed to update tag" }
  }
}

export async function deleteTag(id: string) {
  try {
    const admin = await isAdminUser()
    if (!admin) {
      return { success: false, error: "Admin access required" }
    }

    await prisma.tag.delete({
      where: { id },
    })

    revalidatePath("/admin/tags")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return { success: false, error: "Failed to delete tag" }
  }
}

export async function approveTag(id: string) {
  try {
    const admin = await isAdminUser()
    if (!admin) {
      return { success: false, error: "Admin access required" }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { isApproved: true },
    })

    revalidatePath("/admin/tags")
    revalidatePath("/")

    return { success: true, data: tag }
  } catch (error) {
    console.error("Error approving tag:", error)
    return { success: false, error: "Failed to approve tag" }
  }
}
