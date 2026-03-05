import { notFound } from "next/navigation"
import { getSiteById } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Heart, ThumbsUp, Monitor, Smartphone, Globe } from "lucide-react"
import { FavoriteButton } from "@/components/layout/favorite-button"
import { LikeButton } from "@/components/layout/like-button"

export default async function ToolDetailPage({ params }: { params: { id: string } }) {
  const result = await getSiteById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const site = result.data
  const tags = JSON.parse(site.tags || '[]') as string[]
  const platforms = JSON.parse(site.platforms || '[]') as string[]
  const screenshots = JSON.parse(site.screenshots || '[]') as string[]

  const platformIcons: Record<string, any> = {
    'Web': Globe,
    'Desktop': Monitor,
    'Mobile': Smartphone,
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="grid gap-6 md:grid-cols-3">
        {/* 主要内容 */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  {site.iconUrl && (
                    <img src={site.iconUrl} alt={site.name} className="h-16 w-16 rounded" />
                  )}
                  <div>
                    <CardTitle className="text-3xl">{site.name}</CardTitle>
                    <CardDescription className="mt-2">{site.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button asChild>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    访问网站
                  </a>
                </Button>
                <FavoriteButton siteId={site.id} />
                <LikeButton siteId={site.id} initialCount={site.likesCount || 0} type="site" />
              </div>

              {tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {platforms.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">平台</h3>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((platform) => {
                        const Icon = platformIcons[platform] || Globe
                        return (
                          <Badge key={platform} variant="outline">
                            <Icon className="mr-1 h-3 w-3" />
                            {platform}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {site.useCases && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">使用场景</h3>
                    <p className="text-sm text-muted-foreground">{site.useCases}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>截图预览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {screenshots.map((screenshot, index) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`${site.name} 截图 ${index + 1}`}
                      className="rounded-lg border"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="font-medium mb-1">分类</div>
                <Badge>{site.category?.name}</Badge>
              </div>
              <Separator />
              <div>
                <div className="font-medium mb-1">链接</div>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {site.url}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
