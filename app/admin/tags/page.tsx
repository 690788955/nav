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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTags, createTag, updateTag, deleteTag, approveTag } from "@/lib/actions/tags"

export default function AdminTagsPage() {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(null)
  const [tagName, setTagName] = useState("")
  const [isOfficial, setIsOfficial] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    setLoading(true)
    try {
      const result = await getTags({})
      if (result.success && result.data) {
        setTags(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingTag(null)
    setTagName("")
    setIsOfficial(false)
    setDialogOpen(true)
  }

  function openEditDialog(tag: any) {
    setEditingTag(tag)
    setTagName(tag.name)
    setIsOfficial(tag.isOfficial)
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!tagName.trim()) {
      toast({
        title: "请输入标签名称",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      let result
      if (editingTag) {
        result = await updateTag(editingTag.id, {
          name: tagName,
          isOfficial,
        })
      } else {
        result = await createTag({
          name: tagName,
          isOfficial,
        })
      }

      if (result.success) {
        toast({
          title: editingTag ? "更新成功" : "创建成功",
        })
        setDialogOpen(false)
        fetchTags()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      const result = await approveTag(id)
      if (result.success) {
        toast({ title: "审核通过" })
        fetchTags()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "审核失败",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除此标签吗？")) return

    try {
      const result = await deleteTag(id)
      if (result.success) {
        toast({ title: "删除成功" })
        fetchTags()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">标签管理</h1>
          <p className="text-muted-foreground mt-1">
            管理工具标签，审核用户提交的标签
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          新增标签
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>标签列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">暂无标签</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标签名</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tag.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tag.isOfficial ? "default" : "secondary"}>
                        {tag.isOfficial ? "官方" : "用户"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tag.isApproved ? (
                        <Badge variant="outline" className="gap-1">
                          <Check className="h-3 w-3" />
                          已审核
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <X className="h-3 w-3" />
                          待审核
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!tag.isApproved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(tag.id)}
                          >
                            审核通过
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(tag)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "编辑标签" : "新增标签"}</DialogTitle>
            <DialogDescription>
              {editingTag ? "修改标签信息" : "创建新的标签"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">标签名称</Label>
              <Input
                id="name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="输入标签名称"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isOfficial"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isOfficial">官方标签</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
