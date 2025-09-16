"use client"
import { auth } from "@/lib/firebase"

export default function ProfilePage() {
  const u = auth.currentUser
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="space-y-2 text-sm">
        <div><span className="font-medium">Name:</span> {u?.displayName || "—"}</div>
        <div><span className="font-medium">Email:</span> {u?.email || "—"}</div>
        <div><span className="font-medium">UID:</span> {u?.uid || "—"}</div>
      </div>
    </div>
  )
}