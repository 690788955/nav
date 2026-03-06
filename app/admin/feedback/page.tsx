"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { getFeedbacks, deleteFeedback } from "@/lib/actions/feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Field, FieldLabel } from "@/components/ui/field"
import { Loader2, RotateCcw, Trash2 } from "lucide-react"
import { adminPageCopy } from "@/lib/admin-copy"

type FeedbackType = "feature_request" | "bug_report" | "improvement"
type SortBy = "time" | "likes"

interface FeedbackItem {
  id: string
  toolId: string
  type: FeedbackType
  content: string
  contact: string | null
  likesCount: number
  createdAt: string | Date
  tool?: {
    id: string
    name: string
    url: string
  } | null
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  feature_request: "功能建议",
  bug_report: "问题反馈",
  improvement: "改进建议",
}

export default function AdminFeedbackPage() {
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<"all" | FeedbackType>("all")
  const [sortBy, setSortBy] = useState<SortBy>("time")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null)

  const loadFeedbacks = useCallback(async (currentPage = 1) => {
    setLoading(true)
    try {
      const result = await getFeedbacks({
        page: currentPage,
        pageSize: 10,
        type: typeFilter === "all" ? undefined : typeFilter,
        sortBy,
      })

      if (result.success && result.data) {
        setFeedbacks(result.data as FeedbackItem[])
        setPagination((result.pagination as PaginationInfo) || null)
        setPage(result.pagination?.page || 1)
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: result.error || "无法加载反馈列表",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }, [sortBy, toast, typeFilter])

  useEffect(() => {
    loadFeedbacks(1)
  }, [loadFeedbacks])

  const handleResetFilters = () => {
    setTypeFilter("all")
    setSortBy("time")
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return
    loadFeedbacks(newPage)
  }

  const handleDeleteClick = (feedbackId: string) => {
    setDeletingFeedbackId(feedbackId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingFeedbackId) return
    try {
      const result = await deleteFeedback(deletingFeedbackId)
      if (result.success) {
        toast({
          title: "删除成功",
          description: "反馈已删除",
        })
        loadFeedbacks(page)
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.error || "删除失败，请稍后重试",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingFeedbackId(null)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>反馈类型</FieldLabel>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | FeedbackType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="反馈类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="feature_request">功能建议</SelectItem>
                <SelectItem value="bug_report">问题反馈</SelectItem>
                <SelectItem value="improvement">改进建议</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>排序</FieldLabel>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">按时间</SelectItem>
                <SelectItem value="likes">按点赞</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {(typeFilter !== "all" || sortBy !== "time") && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleResetFilters}>
                    <RotateCcw className="h-4 w-4" />
                    <span className="sr-only">重置筛选</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>重置筛选</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{adminPageCopy.feedback.title}</CardTitle>
          <CardDescription>{adminPageCopy.feedback.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">暂无反馈，试试切换筛选条件</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工具</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>反馈内容</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>点赞数</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="font-medium">{feedback.tool?.name || "未知工具"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{FEEDBACK_TYPE_LABELS[feedback.type] || feedback.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[420px] truncate">{feedback.content}</TableCell>
                    <TableCell className="text-muted-foreground">{feedback.contact || "-"}</TableCell>
                    <TableCell>{feedback.likesCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(feedback.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(feedback.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>删除反馈</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (pageNum) =>
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
              )
              .map((pageNum, idx, arr) => {
                const prevPage = arr[idx - 1]
                const showEllipsis = prevPage && pageNum - prevPage > 1

                return (
                  <div key={pageNum} className="flex items-center">
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={pageNum === page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                )
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={
                  page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，这条反馈将从前台和后台列表中移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
