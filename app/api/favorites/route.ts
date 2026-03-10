import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getClientKey(request: NextRequest): string {
  const ip = (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )

  const ua = request.headers.get("user-agent") || "unknown"
  return `${ip}:${ua}`
}

export async function GET(request: NextRequest) {
  try {
    const userKey = getClientKey(request)
    const favorites = await prisma.favorite.findMany({
      where: { userKey },
      select: { siteId: true },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      success: true,
      favorites: favorites.map((item) => item.siteId),
    })
  } catch (error) {
    // Favorite table may not exist in some environments before migration
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ success: true, favorites: [] })
  }
}

export async function PUT(request: NextRequest) {
  let deduped: string[] = []

  try {
    const userKey = getClientKey(request)
    const body = await request.json()
    const incoming = Array.isArray(body?.favorites)
      ? body.favorites.filter((item: unknown): item is string => typeof item === "string")
      : []

    deduped = Array.from(new Set(incoming))

    const existing = await prisma.favorite.findMany({
      where: { userKey },
      select: { siteId: true },
    })

    const existingIds = new Set(existing.map((item) => item.siteId))

    const validSites = deduped.length > 0
      ? await prisma.site.findMany({
          where: { id: { in: deduped } },
          select: { id: true },
        })
      : []

    const validSiteIds = new Set(validSites.map((site) => site.id))
    const canonicalFavorites = deduped.filter((id) => validSiteIds.has(id))
    const incomingIds = new Set(canonicalFavorites)

    const toCreate = canonicalFavorites.filter((id) => !existingIds.has(id))
    const toDelete = existing
      .map((item) => item.siteId)
      .filter((id) => !incomingIds.has(id))

    if (toCreate.length > 0) {
      await prisma.favorite.createMany({
        data: toCreate.map((siteId) => ({ siteId, userKey })),
      })
    }

    if (toDelete.length > 0) {
      await prisma.favorite.deleteMany({
        where: {
          userKey,
          siteId: { in: toDelete },
        },
      })
    }

    return NextResponse.json({ success: true, favorites: canonicalFavorites })
  } catch (error) {
    // Graceful fallback to local-only behavior when persistence unavailable
    console.error("Error updating favorites:", error)
    return NextResponse.json({ success: true, favorites: deduped })
  }
}
