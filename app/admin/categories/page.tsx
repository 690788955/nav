"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CategoryFormDialog } from "@/components/admin/category-form-dialog"
import { useToast } from "@/hooks/use-toast"
import { adminPageCopy } from "@/lib/admin-copy"
import { deleteCategory, getAllCategoriesWithCount, reorderCategories } from "@/lib/actions"
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  order: number
  _count?: {
    sites: number
  }
}

function moveCategory(items: Category[], fromId: string, toId: string): Category[] {
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

export default function AdminCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAllCategoriesWithCount()
      if (result.success && result.data) {
        setCategories(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: result.error || "无法加载分类列表",
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
  }, [toast])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleCreate = () => {
    setDialogMode("create")
    setEditingCategoryId(null)
    setDialogOpen(true)
  }

  const handleEdit = (categoryId: string) => {
    setDialogMode("edit")
    setEditingCategoryId(categoryId)
    setDialogOpen(true)
  }

  const handleDeleteClick = (categoryId: string) => {
    setDeletingCategoryId(categoryId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCategoryId) return

    try {
      const result = await deleteCategory(deletingCategoryId)
      if (result.success) {
        toast({
          title: "删除成功",
          description: "分类已删除",
        })
        loadCategories()
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
      setDeletingCategoryId(null)
    }
  }

  const handleDragStart = (categoryId: string) => {
    setDraggingCategoryId(categoryId)
  }

  const handleDragEnd = () => {
    setDraggingCategoryId(null)
    setDragOverCategoryId(null)
  }

  const handleDrop = async (targetCategoryId: string) => {
    if (!draggingCategoryId || draggingCategoryId === targetCategoryId || savingOrder) {
      return
    }

    const previous = [...categories]
    const next = moveCategory(categories, draggingCategoryId, targetCategoryId)

    if (next === categories) {
      handleDragEnd()
      return
    }

    setCategories(next)
    setSavingOrder(true)
    handleDragEnd()

    try {
      const result = await reorderCategories(next.map((item) => item.id))
      if (!result.success) {
        setCategories(previous)
        toast({
          variant: "destructive",
          title: "排序失败",
          description: result.error || "分类排序保存失败，请稍后重试",
        })
        return
      }

      toast({
        title: "排序已更新",
        description: "分类优先级已按拖拽顺序保存",
      })
      loadCategories()
    } catch (error) {
      setCategories(previous)
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
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{adminPageCopy.categories.title}</CardTitle>
              <CardDescription>{adminPageCopy.categories.description}</CardDescription>
              <p className="text-xs text-muted-foreground">
                可直接拖拽左侧图标调整优先级，数字越小排序越靠前
              </p>
            </div>
            <CardAction>
              <Button onClick={handleCreate} disabled={savingOrder}>
                <Plus className="mr-2 h-4 w-4" />
                新增分类
              </Button>
            </CardAction>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              暂无分类，点击「新增分类」添加第一个分类
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[56px]">拖拽</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>标识</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>网站数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const isDragging = draggingCategoryId === category.id
                  const isDragOver = dragOverCategoryId === category.id && draggingCategoryId !== category.id

                  return (
                    <TableRow
                      key={category.id}
                      draggable={!savingOrder}
                      onDragStart={() => handleDragStart(category.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(event) => {
                        event.preventDefault()
                        if (dragOverCategoryId !== category.id) {
                          setDragOverCategoryId(category.id)
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        handleDrop(category.id)
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
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                      <TableCell>{category.order}</TableCell>
                      <TableCell>{category._count?.sites || 0}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(category.id)}
                                disabled={savingOrder}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>编辑分类</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(category.id)}
                                disabled={savingOrder}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>删除分类</p>
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

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoryId={editingCategoryId}
        mode={dialogMode}
        onSuccess={() => loadCategories()}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个分类吗？此操作将同时删除该分类下的所有网站，无法撤销。
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
