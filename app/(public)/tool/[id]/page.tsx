import { notFound } from "next/navigation"
import { getSiteById } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ExternalLink } from "lucide-react"
import { ToolActions } from "./tool-actions"

export default async function ToolDetailPage({ params }: { params: { id: string } }) {
  const { data: site } = await getSiteById(params.id)

  if (!site) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                {site.iconUrl && (
                  <img
                    src={site.iconUrl}
                    alt={`${site.name} 图标`}
                    className="h-16 w-16 rounded"
                  />
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl">{site.name}</CardTitle>
                  {site.category && (
                    <CardDescription className="mt-1">
                      {site.category.name}
                    </CardDescription>
                  )}
                </div>
              </div>
              <ToolActions site={site} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {site.description && (
              <div>
                <h3 className="font-semibold mb-2">简介</h3>
                <p className="text-muted-foreground">{site.description}</p>
              </div>
            )}

            {site.tags && site.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {site.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {site.platforms && site.platforms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">平台</h3>
                <div className="flex flex-wrap gap-2">
                  {site.platforms.map((platform: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {site.useCases && (
              <div>
                <h3 className="font-semibold mb-2">使用场景</h3>
                <p className="text-muted-foreground">{site.useCases}</p>
              </div>
            )}

            {site.screenshots && site.screenshots.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">截图</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {site.screenshots.map((screenshot: string, index: number) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`${site.name} 截图 ${index + 1}`}
                      className="rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex justify-center">
              <Button asChild size="lg">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  访问工具
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
