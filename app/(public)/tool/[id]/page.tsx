import { notFound } from "next/navigation"
import { SearchableLayout } from "@/components/layout/searchable-layout"
import { getAllCategories, getSiteById, getSites, getSystemSettings } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, ThumbsUp } from "lucide-react"
import { ToolActions } from "./tool-actions"

interface ToolDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function getInitialIcon(name: string) {
  const trimmed = name.trim()

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]
    const code = char.codePointAt(0) || 0

    const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
    const isChinese = code >= 0x4e00 && code <= 0x9fff

    if (isLetter || isChinese) {
      return char.toUpperCase()
    }
  }

  return "N"
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { id } = await params
  const [{ data: site }, { data: allCategories }, { data: settings }, { data: allSites }] = await Promise.all([
    getSiteById(id),
    getAllCategories(),
    getSystemSettings(),
    getSites(),
  ])

  if (!site) {
    notFound()
  }

  const flatSites = allSites?.filter((item) => item.isPublished) || []
  const initial = getInitialIcon(site.name)

  return (
    <SearchableLayout
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={settings?.siteName}
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
          <p className="text-sm text-muted-foreground">工具详情</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start gap-4">
                {site.iconUrl ? (
                  <img
                    src={site.iconUrl}
                    alt={`${site.name} 图标`}
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-xl font-semibold text-muted-foreground"
                    title={site.name}
                  >
                    {initial}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <CardTitle className="text-2xl leading-tight">{site.name}</CardTitle>
                  {site.category?.name && <CardDescription>{site.category.name}</CardDescription>}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{site.likesCount} 点赞</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">网址</p>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block break-all text-sm text-primary underline-offset-4 hover:underline"
                >
                  {site.url}
                </a>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{site.description}</p>

              <Separator />

              <div className="flex flex-wrap items-center gap-3">
                <ToolActions site={site} />
                <Button asChild>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    访问工具
                  </a>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">更多信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">标签</p>
                {site.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {site.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无标签</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">平台</p>
                {site.platforms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {site.platforms.map((platform: string) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无平台信息</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">使用场景</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {site.useCases || "暂无使用场景描述"}
                </p>
              </div>

              {site.screenshots.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">截图</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {site.screenshots.map((screenshot: string, index: number) => (
                        <img
                          key={`${screenshot}-${index}`}
                          src={screenshot}
                          alt={`${site.name} 截图 ${index + 1}`}
                          className="h-auto w-full rounded-md border object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SearchableLayout>
  )
}
