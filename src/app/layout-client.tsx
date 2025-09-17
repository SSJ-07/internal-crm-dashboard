"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore"

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

interface Reminder {
  id: string
  title: string
  due: string
  studentName: string
  createdAt: any
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login")
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  // Fetch reminders for notification count
  useEffect(() => {
    if (!user) return
    
    const remindersRef = collection(db, "reminders")
    const q = query(
      remindersRef, 
      where("createdBy", "==", user.email)
      // Removed orderBy to avoid index requirement - we'll sort in JavaScript instead
    )
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const remindersData: Reminder[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Reminder[]
        // Sort by due date in JavaScript instead of Firestore
        remindersData.sort((a, b) => a.due.localeCompare(b.due))
        console.log("Fetched reminders:", remindersData)
        setReminders(remindersData)
      },
      (error) => {
        console.error("Error fetching reminders:", error)
        console.log("Current user:", user?.email)
        console.log("Error details:", error)
      }
    )

    return () => unsubscribe()
  }, [user])

  const getUpcomingReminders = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return reminders.filter(reminder => {
      // Ensure we have a valid date string
      if (!reminder.due) return false
      return reminder.due >= today && reminder.due <= nextWeek
    })
  }

  const getOverdueReminders = () => {
    const today = new Date().toISOString().split('T')[0]
    return reminders.filter(reminder => {
      // Ensure we have a valid date string
      if (!reminder.due) return false
      return reminder.due < today
    })
  }

  const upcomingReminders = getUpcomingReminders()
  const overdueReminders = getOverdueReminders()
  const totalReminders = upcomingReminders.length + overdueReminders.length

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

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none relative">
                <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                  </svg>
                  {totalReminders > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {totalReminders}
                    </span>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 shadow-lg border-0">
                <DropdownMenuLabel className="text-center text-gray-700 font-semibold">
                  Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {totalReminders === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="text-4xl mb-2">🔔</div>
                    <div className="text-sm">No notifications</div>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {overdueReminders.length > 0 && (
                      <div className="p-3">
                        <div className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Overdue ({overdueReminders.length})
                        </div>
                        {overdueReminders.map((reminder) => (
                          <div key={reminder.id} className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg mb-3 hover:bg-red-100 transition-colors">
                            <div className="font-medium text-sm text-gray-800">{reminder.title}</div>
                            <div className="text-xs text-gray-600 mt-1">Student: {reminder.studentName}</div>
                            <div className="text-xs text-red-600 font-medium mt-1">Due: {reminder.due}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {upcomingReminders.length > 0 && (
                      <div className="p-3">
                        <div className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Upcoming ({upcomingReminders.length})
                        </div>
                        {upcomingReminders.map((reminder) => (
                          <div key={reminder.id} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg mb-3 hover:bg-blue-100 transition-colors">
                            <div className="font-medium text-sm text-gray-800">{reminder.title}</div>
                            <div className="text-xs text-gray-600 mt-1">Student: {reminder.studentName}</div>
                            <div className="text-xs text-blue-600 font-medium mt-1">Due: {reminder.due}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile menu */}
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
          </div>
        </header>

        {children}
      </main>
    </>
  )
}