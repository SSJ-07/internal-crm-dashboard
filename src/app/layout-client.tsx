"use client"

import { useEffect, useState } from "react"
import { onAuthChange, logout } from "@/lib/auth"

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    return onAuthChange((u) => setUser(u)) // subscribe to auth state
  }, [])

  if (!user) {
    // not logged in → redirect
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  return (
    <>
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
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Internal CRM Dashboard</h2>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        {children}
      </main>
    </>
  )
}