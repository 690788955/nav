"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ThumbsUp, MessageSquarePlus } from "lucide-react"
import { useLikes } from "@/hooks/use-likes"
import { FeedbackDialog } from "@/components/layout/feedback-dialog"

const typeLabels: Record<string, string> = {
  feature_request: "功能建议",
  bug_report: "Bug反馈",
  improvement: "体验改进",
}

const typeColors: Record<string, string> = {
  feature_request: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  bug_report: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  improvement: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toolId, setToolId] = useState<string>("all")
  const [type, setType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("time")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { toggleLike, isLiked, mounted } = useLikes()

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch("/api/feedback?pageSize=1")
        // Also fetch sites for filter dropdown
        const { getSites } = await import("@/lib/actions")
        const { data } = await getSites()
        if (data) {
          setSites(data.filter(s => s.isPublished))
        }
      } catch {}
    }
    fetchSites()
  }, [])

  useEffect(() => {
    async function fetchFeedbacks() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (toolId !== "all") params.set("toolId", toolId)
        if (type !== "all") params.set("type", type)
        params.set("sortBy", sortBy)
        params.set("page", String(page))
        params.set("pageSize", "10")

        const res = await fetch(`/api/feedback?${params}`)
        const result = await res.json()

        if (result.success) {
          setFeedbacks(result.data || [])
          setTotal(result.pagination?.total || 0)
        }
      } catch (error) {
        console.error("Failed to fetch feedbacks:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeedbacks()
  }, [toolId, type, sortBy, page])

  const handleLikeFeedback = async (feedbackId: string) => {
    const currentlyLiked = isLiked("feedback", feedbackId)
    toggleLike("feedback", feedbackId)

    setFeedbacks(prev =>
      prev.map(f =>
        f.id === feedbackId
          ? { ...f, likesCount: Math.max(0, f.likesCount + (currentlyLiked ? -1 : 1)) }
          : f
      )
    )

    try {
      const response = await fetch(`/api/likes/feedback/${feedbackId}`, {
        method: currentlyLiked ? "DELETE" : "POST",
      })
      if (!response.ok) throw new Error()
    } catch {
      toggleLike("feedback", feedbackId)
      setFeedbacks(prev =>
        prev.map(f =>
          f.id === feedbackId
            ? { ...f, likesCount: Math.max(0, f.likesCount + (currentlyLiked ? 1 : -1)) }
            : f
        )
      )
    }
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">反馈中心</h1>
          <p className="text-muted-foreground mt-1">
            查看并提交工具反馈建议
          </p>
        </div>
        <FeedbackDialog>
          <Button className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            提交反馈
          </Button>
        </FeedbackDialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={toolId} onValueChange={(v) => { setToolId(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择工具" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部工具</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="反馈类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="feature_request">功能建议</SelectItem>
            <SelectItem value="bug_report">Bug反馈</SelectItem>
            <SelectItem value="improvement">体验改进</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">按时间</SelectItem>
            <SelectItem value="likes">按热度</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <MessageSquarePlus className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">暂无反馈</h2>
          <p className="text-muted-foreground">成为第一个提交反馈的人吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={typeColors[feedback.type] || ""}>
                      {typeLabels[feedback.type] || feedback.type}
                    </Badge>
                    {feedback.tool && (
                      <span className="text-sm text-muted-foreground">
                        {feedback.tool.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(feedback.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{feedback.content}</p>
                {mounted && (
                  <button
                    onClick={() => handleLikeFeedback(feedback.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ThumbsUp
                      className={`h-4 w-4 ${
                        isLiked("feedback", feedback.id)
                          ? "fill-blue-500 text-blue-500"
                          : ""
                      }`}
                    />
                    <span>{feedback.likesCount}</span>
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
