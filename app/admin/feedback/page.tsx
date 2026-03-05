"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, ThumbsUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const typeLabels: Record<string, string> = {
  feature_request: "功能建议",
  bug_report: "Bug反馈",
  improvement: "体验改进",
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toolId, setToolId] = useState<string>("all")
  const [type, setType] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function fetchSites() {
      try {
        const { getSites } = await import("@/lib/actions")
        const { data } = await getSites()
        if (data) {
          setSites(data)
        }
      } catch {}
    }
    fetchSites()
  }, [])

  useEffect(() => {
    fetchFeedbacks()
  }, [toolId, type, page])

  async function fetchFeedbacks() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (toolId !== "all") params.set("toolId", toolId)
      if (type !== "all") params.set("type", type)
      params.set("page", String(page))
      params.set("pageSize", "20")
      params.set("sortBy", "time")

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

  async function handleDelete() {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/feedback/${deleteId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error()

      toast({
        title: "删除成功",
        description: "反馈已删除",
      })

      setDeleteId(null)
      fetchFeedbacks()
    } catch {
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">反馈管理</h1>
        <p className="text-muted-foreground mt-1">
          管理用户提交的反馈建议
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>反馈列表</CardTitle>
            <div className="flex gap-2">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">暂无反馈</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工具</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>联系方式</TableHead>
                    <TableHead>点赞</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="font-medium">
                        {feedback.tool?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabels[feedback.type] || feedback.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {feedback.content}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {feedback.contact || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span className="text-sm">{feedback.likesCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(feedback.createdAt).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(feedback.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
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
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该反馈，删除后无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
