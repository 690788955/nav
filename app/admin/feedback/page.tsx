import { getFeedbacks } from "@/lib/actions/feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default async function AdminFeedbackPage() {
  const result = await getFeedbacks({ page: 1, pageSize: 100 })
  const feedbacks = result.success ? result.data || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">反馈管理</h1>
        <p className="text-muted-foreground mt-2">管理用户提交的反馈</p>
      </div>

      <div className="space-y-4">
        {feedbacks.map((feedback: any) => (
          <Card key={feedback.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{feedback.tool?.name}</CardTitle>
                  <CardDescription>
                    {feedback.type} · {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                  </CardDescription>
                </div>
                <form action={async () => {
                  "use server"
                  const { deleteFeedback } = await import("@/lib/actions/feedback")
                  await deleteFeedback(feedback.id)
                }}>
                  <Button variant="destructive" size="sm" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
              {feedback.contact && (
                <p className="text-sm text-muted-foreground mt-2">联系方式: {feedback.contact}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
