import { AdminLayout } from "@/components/admin/admin-layout"

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
