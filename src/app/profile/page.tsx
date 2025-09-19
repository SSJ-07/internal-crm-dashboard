"use client"
import { useState, useEffect } from "react"
import { auth, User } from "@/lib/auth"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current user
    const currentUser = auth.currentUser
    setUser(currentUser)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="max-w-xl">Loading...</div>
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="space-y-2 text-sm">
        <div><span className="font-medium">Name:</span> {user?.name || "—"}</div>
        <div><span className="font-medium">Email:</span> {user?.email || "—"}</div>
        <div><span className="font-medium">ID:</span> {user?.id || "—"}</div>
      </div>
    </div>
  )
}