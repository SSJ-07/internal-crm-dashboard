"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
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
  description: string
  reminder_date: string
  status: string
  studentName?: string
  createdAt: any
}

interface DashboardStats {
  total_students: number
  status_breakdown: Record<string, number>
  country_breakdown: Record<string, number>
  high_intent_count: number
  needs_essay_help_count: number
  upcoming_reminders: number
  overdue_reminders: number
  total_reminders: number
}

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch reminders
        const remindersResponse = await apiClient.getReminders()
        if (remindersResponse.success && remindersResponse.data) {
          setReminders(remindersResponse.data)
        }
        
        // Fetch students
        const studentsResponse = await apiClient.getStudents()
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data)
        }
        
        // Fetch dashboard stats
        const statsResponse = await apiClient.getDashboardStats()
        if (statsResponse.success) {
          setStats(statsResponse.data)
        }
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getUpcomingReminders = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return reminders.filter(reminder => {
      // Ensure we have a valid date string
      if (!reminder.reminder_date) return false
      return reminder.reminder_date >= today && reminder.reminder_date <= nextWeek
    })
  }

  const getOverdueReminders = () => {
    const today = new Date().toISOString().split('T')[0]
    return reminders.filter(reminder => {
      // Ensure we have a valid date string
      if (!reminder.reminder_date) return false
      return reminder.reminder_date < today
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
                        <p className="text-sm text-gray-600">Student: {reminder.studentName || 'General'}</p>
                        <p className="text-sm text-red-600">Due: {reminder.reminder_date}</p>
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
                        <p className="text-sm text-gray-600">Student: {reminder.studentName || 'General'}</p>
                        <p className="text-sm text-blue-600">Due: {reminder.reminder_date}</p>
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
              <div className="text-3xl font-bold text-blue-600">
                {stats?.total_students || students.length}
              </div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {(stats?.status_breakdown?.["Applying"] || 0) + (stats?.status_breakdown?.["Submitted"] || 0)}
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
                {stats?.high_intent_count || students.filter(s => s.highIntent).length}
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
                {stats?.status_breakdown?.["Exploring"] || students.filter(s => s.status === "Exploring").length}
              </div>
              <div className="text-sm text-gray-600">Exploring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.status_breakdown?.["Shortlisting"] || students.filter(s => s.status === "Shortlisting").length}
              </div>
              <div className="text-sm text-gray-600">Shortlisting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.status_breakdown?.["Applying"] || students.filter(s => s.status === "Applying").length}
              </div>
              <div className="text-sm text-gray-600">Applying</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats?.status_breakdown?.["Submitted"] || students.filter(s => s.status === "Submitted").length}
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