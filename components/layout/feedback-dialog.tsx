"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
  type: z.enum(["feature_request", "bug_report", "improvement"], {
    required_error: "请选择反馈类型",
  }),
  content: z.string().min(1, "反馈内容不能为空").max(1000, "反馈内容不能超过1000个字符"),
  contact: z.string().max(100, "联系方式不能超过100个字符").optional(),
})

type FormValues = z.infer<typeof formSchema>

interface FeedbackDialogProps {
  toolId: string
  toolName: string
  children?: React.ReactNode
}

export function FeedbackDialog({ toolId, toolName, children }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      content: "",
      contact: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          type: values.type,
          content: values.content,
          contact: values.contact || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("反馈提交成功！感谢您的贡献")
        form.reset()
        setOpen(false)
      } else {
        toast.error(result.error || "提交失败，请稍后重试")
      }
    } catch (error) {
      toast.error("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-1 h-4 w-4" />
            提交反馈
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>提交反馈</DialogTitle>
          <DialogDescription>
            为 <strong>{toolName}</strong> 提交优化建议或问题反馈
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>反馈类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择反馈类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="feature_request">功能建议</SelectItem>
                      <SelectItem value="bug_report">问题反馈</SelectItem>
                      <SelectItem value="improvement">优化建议</SelectItem>
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
                      placeholder="请详细描述你的建议或遇到的问题..."
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

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交反馈
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
