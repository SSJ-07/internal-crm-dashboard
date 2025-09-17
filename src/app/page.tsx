"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Student {
  id: string
  name: string
  email: string
  country: string
  status: string
  lastActive: any
  lastContactedAt?: any
  highIntent?: boolean
  needsEssayHelp?: boolean
}

interface Reminder {
  id: string
  title: string
  due: string
  studentName: string
  createdAt: any
}

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false)
      return
    }
    
    const remindersRef = collection(db, "reminders")
    const q = query(
      remindersRef, 
      where("createdBy", "==", auth.currentUser.email)
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
        setReminders(remindersData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching reminders:", error)
        console.log("Current user:", auth.currentUser?.email)
        console.log("Error details:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
    setLoading(false)
  }, [])

  // Fetch students data for dashboard stats
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const studentsData: Student[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[]
      setStudents(studentsData)
    })

    return () => unsubscribe()
  }, [])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Welcome to your CRM Dashboard 🚀
        </h1>
        <p className="text-gray-700">
          Use the sidebar to navigate between Students, Tasks, and Settings.
        </p>
      </div>

      {/* Personal Reminders */}
      {!loading && (upcomingReminders.length > 0 || overdueReminders.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔔 Personal Reminders
              {(overdueReminders.length > 0 || upcomingReminders.length > 0) && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {overdueReminders.length + upcomingReminders.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueReminders.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-600 mb-2">⚠️ Overdue ({overdueReminders.length})</h4>
                <div className="space-y-2">
                  {overdueReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-gray-600">Student: {reminder.studentName}</p>
                        <p className="text-sm text-red-600">Due: {reminder.due}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcomingReminders.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-600 mb-2">📅 Upcoming ({upcomingReminders.length})</h4>
                <div className="space-y-2">
                  {upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-gray-600">Student: {reminder.studentName}</p>
                        <p className="text-sm text-blue-600">Due: {reminder.due}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Student Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{students.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {students.filter(s => s.status === "Applying" || s.status === "Submitted").length}
              </div>
              <div className="text-sm text-gray-600">In Essay Stage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {students.filter(s => {
                  if (!s.lastContactedAt) return true
                  const lastContacted = s.lastContactedAt?.toDate?.() || s.lastContactedAt
                  const lastContactedMs = lastContacted instanceof Date ? lastContacted.getTime() : 0
                  return Date.now() - lastContactedMs > 7 * 24 * 60 * 60 * 1000
                }).length}
              </div>
              <div className="text-sm text-gray-600">Not Contacted (7d)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {students.filter(s => s.highIntent).length}
              </div>
              <div className="text-sm text-gray-600">High Intent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {students.filter(s => s.status === "Exploring").length}
              </div>
              <div className="text-sm text-gray-600">Exploring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {students.filter(s => s.status === "Shortlisting").length}
              </div>
              <div className="text-sm text-gray-600">Shortlisting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {students.filter(s => s.status === "Applying").length}
              </div>
              <div className="text-sm text-gray-600">Applying</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.status === "Submitted").length}
              </div>
              <div className="text-sm text-gray-600">Submitted</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              <a href="/students" className="hover:underline">View Students</a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              <a href="/tasks" className="hover:underline">View Tasks</a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              <a href="/profile" className="hover:underline">View Profile</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}