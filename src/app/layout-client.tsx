"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

// shadcn ui
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login")
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  if (loading) return <p className="p-8">Loading...</p>

  const initials =
    user?.displayName?.split(" ").map((s: string) => s[0]).join("").toUpperCase()
    || (user?.email ? user.email[0].toUpperCase() : "U")

  const isAuthenticated = !!user

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

          {/* Profile menu (replaces the old Logout button) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName || "User"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAuthenticated ? (
                <>
                  <DropdownMenuLabel className="space-y-1">
                    <div className="text-sm font-medium">{user?.displayName || "User"}</div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel className="space-y-1">
                    <div className="text-sm font-medium">Guest</div>
                    <div className="text-xs text-gray-500 truncate">Not signed in</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/login")}>
                    Sign in
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {children}
      </main>
    </>
  )
}