"use client"

import "./globals.css"
import { auth } from "@/lib/firebase"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const handleLogout = async () => {
    await auth.signOut()
    window.location.href = "/login"
  }

  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100 text-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col">
          <div className="p-4 text-2xl font-bold">CRM</div>
          <nav className="flex flex-col gap-2 p-4">
            <a href="/" className="px-3 py-2 rounded hover:bg-gray-800">Dashboard</a>
            <a href="/students" className="px-3 py-2 rounded hover:bg-gray-800">Students</a>
            <a href="/tasks" className="px-3 py-2 rounded hover:bg-gray-800">Tasks</a>
            <a href="/settings" className="px-3 py-2 rounded hover:bg-gray-800">Settings</a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Top bar */}
          <header className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Internal CRM Dashboard</h2>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </header>

          {children}
        </main>
      </body>
    </html>
  )
}