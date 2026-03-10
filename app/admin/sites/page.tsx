"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, Pencil, Trash2, Power, Loader2, RotateCcw, GripVertical } from "lucide-react"
import { SiteFormDialog } from "@/components/admin/site-form-dialog"
import { getSitesWithPagination, deleteSite, toggleSitePublish, getCategoriesForFilter, reorderSites } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { adminPageCopy } from "@/lib/admin-copy"

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  submitterContact: string | null
  submitterIp: string | null
  categoryId: string
  isPublished: boolean
  order: number
  category: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

function moveSite(items: Site[], fromId: string, toId: string): Site[] {
  const fromIndex = items.findIndex((item) => item.id === fromId)
  const toIndex = items.findIndex((item) => item.id === toId)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)

  return next.map((item, index) => ({
    ...item,
    order: index + 1,
  }))
}

export default function AdminSitesPage() {
  const { toast } = useToast()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null)

  // 筛选状态
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSubmitter, setFilterSubmitter] = useState<string>("all")

  // 分页状态
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  // 拖动排序状态
  const [draggingSiteId, setDraggingSiteId] = useState<string | null>(null)
  const [dragOverSiteId, setDragOverSiteId] = useState<string | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)

  // 加载网站列表
  const loadSites = async (currentPage = page) => {
    setLoading(true)
    try {
      const result = await getSitesWithPagination({
        page: currentPage,
        pageSize: 10,
        categoryId: filterCategory !== "all" ? filterCategory : undefined,
        isPublished: filterStatus !== "all" ? (filterStatus === "true") : undefined,
        submitterIp: filterSubmitter !== "all" ? filterSubmitter : undefined,
      })
      if (result.success && result.data) {
        setSites(result.data)
        setPagination(result.pagination || null)
        setPage(result.pagination?.page || 1)
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: result.error || "无法加载网站列表",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
title: "加载失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const result = await getCategoriesForFilter()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }

  useEffect(() => {
    loadSites(1)
    loadCategories()
  }, [])

  // 重置筛选
  const handleResetFilters = () => {
    setFilterCategory("all")
    setFilterStatus("all")
    setFilterSubmitter("all")
    setPage(1)
  }

  // 筛选条件改变时重新加载
  useEffect(() => {
    loadSites(1)
  }, [filterCategory, filterStatus, filterSubmitter])

  // 打开创建对话框
  const handleCreate = () => {
    setDialogMode("create")
    setEditingSite(null)
    setDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (site: Site) => {
    setDialogMode("edit")
    setEditingSite(site)
    setDialogOpen(true)
  }

  // 页面切换处理
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return
    loadSites(newPage)
  }

  // 打开删除确认对话框
  const handleDeleteClick = (siteId: string) => {
    setDeletingSiteId(siteId)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!deletingSiteId) return

    try {
      const result = await deleteSite(deletingSiteId)
      if (result.success) {
        toast({
          title: "删除成功",
          description: "网站已删除",
        })
        loadSites()
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.error || "删除失败，请稍后重试",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingSiteId(null)
    }
  }

  // 切换发布状态
  const handleTogglePublish = async (siteId: string) => {
    try {
      const result = await toggleSitePublish(siteId)
      if (result.success) {
        toast({
          title: "状态已更新",
          description: "网站发布状态已切换",
        })
        loadSites()
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.error || "操作失败，请稍后重试",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "操作失败",
        description: "发生错误，请稍后重试",
      })
    }
  }

  // 拖动排序处理
  const handleDragStart = (siteId: string) => {
    setDraggingSiteId(siteId)
  }

  const handleDragEnd = () => {
    setDraggingSiteId(null)
    setDragOverSiteId(null)
  }

  const handleDrop = async (targetSiteId: string) => {
    if (!draggingSiteId || draggingSiteId === targetSiteId || savingOrder) {
      return
    }

    const previous = [...sites]
    const next = moveSite(sites, draggingSiteId, targetSiteId)

    if (next === sites) {
      handleDragEnd()
      return
    }

    setSites(next)
    setSavingOrder(true)
    handleDragEnd()

    try {
      const result = await reorderSites(next.map((item) => item.id))
      if (!result.success) {
        setSites(previous)
        toast({
          variant: "destructive",
          title: "排序失败",
          description: result.error || "网站排序保存失败，请稍后重试",
        })
        return
      }

      toast({
        title: "排序已更新",
        description: "网站优先级已按拖拽顺序保存",
      })
      loadSites()
    } catch (error) {
      setSites(previous)
      toast({
        variant: "destructive",
        title: "排序失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="space-y-4 p-6">
      {/* 筛选器工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 分类筛选 */}
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>分类</FieldLabel>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* 状态筛选 */}
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>状态</FieldLabel>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="true">已发布</SelectItem>
                <SelectItem value="false">草稿</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* 提交者筛选 */}
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>来源</FieldLabel>
            <Select value={filterSubmitter} onValueChange={setFilterSubmitter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="true">用户提交</SelectItem>
                <SelectItem value="false">管理员创建</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* 重置按钮 */}
          {(filterCategory !== "all" || filterStatus !== "all" || filterSubmitter !== "all") && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetFilters}
                  >
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

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增网站
        </Button>
      </div>

      {/* 网站列表卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>{adminPageCopy.sites.title}</CardTitle>
          <CardDescription>{adminPageCopy.sites.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无网站，点击「新增网站」添加第一个网站
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">图标</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交者</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => {
                  const isDragging = draggingSiteId === site.id
                  const isDragOver = dragOverSiteId === site.id && draggingSiteId !== site.id

                  return (
                    <TableRow
                      key={site.id}
                      draggable={!savingOrder}
                      onDragStart={() => handleDragStart(site.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(event) => {
                        event.preventDefault()
                        if (dragOverSiteId !== site.id) {
                          setDragOverSiteId(site.id)
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        handleDrop(site.id)
                      }}
                      className={[
                        "transition-colors",
                        isDragging ? "opacity-40" : "",
                        isDragOver ? "bg-muted/60" : "",
                      ].join(" ")}
                    >
                      <TableCell>
                        <button
                          type="button"
                          className="cursor-grab text-muted-foreground active:cursor-grabbing"
                          aria-label="拖拽调整排序"
                          disabled={savingOrder}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      </TableCell>
                      <TableCell>
                      {site.iconUrl ? (
                        <img
                          src={site.iconUrl}
                          alt={site.name}
                          className="h-8 w-8 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E"
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            {site.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {site.url}
                      </a>
                    </TableCell>
                    <TableCell>{site.category.name}</TableCell>
                    <TableCell>
                      {site.isPublished ? (
                        <Badge variant="default">已发布</Badge>
                      ) : (
                        <Badge variant="secondary">草稿</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {site.submitterIp ? (
                        <span className="text-xs">用户提交</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">管理员创建</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePublish(site.id)}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{site.isPublished ? "取消发布" : "发布网站"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(site)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>编辑网站</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(site.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>删除网站</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {savingOrder && (
            <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在保存排序...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页组件 */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={
                  page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* 页码 */}
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
                  page === pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        site={editingSite}
        mode={dialogMode}
        onSuccess={() => loadSites()}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个网站吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
