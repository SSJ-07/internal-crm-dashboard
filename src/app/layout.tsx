// src/app/layout.tsx
import "./globals.css"
import LayoutClient from "./layout-client"
import { RemindersProvider } from "@/lib/reminders-context"

export const metadata = {
  title: "Internal CRM Dashboard",
  description: "Manage student interactions",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100 text-gray-900">
        <RemindersProvider>
          <LayoutClient>{children}</LayoutClient>
        </RemindersProvider>
      </body>
    </html>
  )
}