"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getSites } from "@/lib/actions"

const feedbackSchema = z.object({
  toolId: z.string().min(1, "请选择工具"),
  type: z.enum(["feature_request", "bug_report", "improvement"], {
    required_error: "请选择反馈类型",
  }),
  content: z.string().min(1, "请输入反馈内容").max(500, "反馈内容不能超过500字"),
  contact: z.string().max(100, "联系方式不能超过100字").optional(),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

interface FeedbackDialogProps {
  children: React.ReactNode
  defaultToolId?: string
}

export function FeedbackDialog({ children, defaultToolId }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [sites, setSites] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      toolId: defaultToolId || "",
      type: "feature_request",
      content: "",
      contact: "",
    },
  })

  useEffect(() => {
    async function fetchSites() {
      const { data } = await getSites()
      if (data) {
        setSites(data.filter(site => site.isPublished))
      }
    }
    fetchSites()
  }, [])

  useEffect(() => {
    if (defaultToolId) {
      form.setValue("toolId", defaultToolId)
    }
  }, [defaultToolId, form])

  const onSubmit = async (data: FeedbackFormData) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "提交失败")
      }

      toast.success("反馈提交成功！感谢您的反馈")
      form.reset()
      setOpen(false)
    } catch (error: any) {
      toast.error(error.message || "提交失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>提交反馈</DialogTitle>
          <DialogDescription>
            告诉我们您的想法，帮助我们改进工具
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>选择工具</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择工具" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>反馈类型</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="feature_request">功能建议</SelectItem>
                      <SelectItem value="bug_report">Bug反馈</SelectItem>
                      <SelectItem value="improvement">体验改进</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>反馈内容</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请详细描述您的反馈..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系方式（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="邮箱或其他联系方式" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "提交反馈"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
