"use server"

import metascraper from "metascraper"
import metascraperTitle from "metascraper-title"
import metascraperDescription from "metascraper-description"
import metascraperImage from "metascraper-image"
import * as cheerio from "cheerio"

/**
 * Metadata extraction result
 */
export interface MetadataResult {
  title: string | null
  description: string | null
  iconUrl: string | null
}

const scraper = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
])

/**
 * Fetch site metadata from a given URL
 * @param url - The URL to fetch metadata from
 * @returns Promise with success status and metadata or error
 */
export async function fetchSiteMetadata(url: string): Promise<{
  success: boolean
  data?: MetadataResult
  error?: string
}> {
  try {
    const domain = new URL(url).hostname
    const fallback: MetadataResult = {
      title: domain,
      description: "",
      iconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    }

    // Setup 8-second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      // Fetch HTML with timeout
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return { success: true, data: fallback }
      }

      const html = await response.text()

      // Extract metadata using metascraper
      const metadata = await scraper({ html, url })

      // Extract favicon using cheerio with fallback chain
      const $ = cheerio.load(html)
      let iconUrl: string | null = null

      // Priority 1: <link rel="icon">
      const iconHref = $('link[rel="icon"]').attr("href")
      if (iconHref) {
        iconUrl = new URL(iconHref, url).href
      }

      // Priority 2: <link rel="apple-touch-icon">
      if (!iconUrl) {
        const appleIconHref = $('link[rel="apple-touch-icon"]').attr("href")
        if (appleIconHref) {
          iconUrl = new URL(appleIconHref, url).href
        }
      }

      // Priority 3: /favicon.ico (verify with HEAD request)
      if (!iconUrl) {
        const faviconUrl = new URL("/favicon.ico", url).href
        try {
          const faviconResponse = await fetch(faviconUrl, {
            method: "HEAD",
            signal: AbortSignal.timeout(2000),
          })
          if (faviconResponse.ok) {
            iconUrl = faviconUrl
          }
        } catch {
          // Favicon.ico not available, continue to fallback
        }
      }

      // Priority 4: Google Favicon Service (final fallback)
      if (!iconUrl) {
        iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      }

      return {
        success: true,
        data: {
          title: metadata.title || fallback.title,
          description: metadata.description || fallback.description,
          iconUrl,
        },
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      // Timeout or network error - return fallback
      return { success: true, data: fallback }
    }
  } catch (error) {
    console.error("Error fetching site metadata:", error)
    return {
      success: false,
      error: "Failed to fetch site metadata",
    }
  }
}
