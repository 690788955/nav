import { getTags } from "@/lib/actions/tags"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

export default async function AdminTagsPage() {
  const result = await getTags()
  const tags = result.success ? result.data || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">标签管理</h1>
        <p className="text-muted-foreground mt-2">管理工具标签</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有标签</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tags.map((tag: any) => (
              <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <span>{tag.name}</span>
                  {tag.isOfficial && <Badge variant="default">官方</Badge>}
                  {tag.isApproved && <Badge variant="secondary">已审核</Badge>}
                </div>
                {!tag.isApproved && (
                  <form action={async () => {
                    "use server"
                    const { approveTag } = await import("@/lib/actions/tags")
                    await approveTag(tag.id)
                  }}>
                    <Button size="sm" type="submit">
                      <Check className="h-4 w-4 mr-1" />
                      审核通过
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
