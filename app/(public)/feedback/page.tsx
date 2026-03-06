import { getFeedbacks } from "@/lib/actions/feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowLeft } from "lucide-react"
import { LikeButton } from "@/components/layout/like-button"
import Link from "next/link"

export const revalidate = 10

const feedbackTypeLabels: Record<string, string> = {
  feature_request: "功能建议",
  bug_report: "问题反馈",
  improvement: "优化建议",
}

const feedbackTypeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  feature_request: "default",
  bug_report: "destructive",
  improvement: "secondary",
}

interface Feedback {
  id: string
  type: string
  content: string
  createdAt: Date
  likesCount: number
  tool?: {
    name: string
  }
}

export default async function FeedbackPage() {
  const result = await getFeedbacks({ page: 1, pageSize: 50, sortBy: 'time' })
  const feedbacks = (result.success ? result.data || [] : []) as Feedback[]

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <MessageSquare className="mr-2 h-8 w-8" />
          反馈中心
        </h1>
        <p className="text-muted-foreground mt-2">
          查看所有用户反馈，帮助我们改进工具
        </p>
      </div>

      {feedbacks.length > 0 ? (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={feedbackTypeColors[feedback.type] || "outline"}>
                        {feedbackTypeLabels[feedback.type] || feedback.type}
                      </Badge>
                      {feedback.tool && (
                        <span className="text-sm text-muted-foreground">
                          关于 <strong>{feedback.tool.name}</strong>
                        </span>
                      )}
                    </div>
                    <CardDescription>
                      {new Date(feedback.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <LikeButton feedbackId={feedback.id} initialCount={feedback.likesCount} type="feedback" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>暂无反馈</CardTitle>
            <CardDescription>
              在工具详情页提交你的第一条反馈吧
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">浏览工具</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
