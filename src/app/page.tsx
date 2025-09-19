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


interface DashboardStats {
  total_students: number
  status_breakdown: Record<string, number>
  country_breakdown: Record<string, number>
  high_intent_count: number
  needs_essay_help_count: number
  applications_in_progress: number
  total_communications: number
  communications_this_month: number
  total_interactions: number
  active_students_this_week: number
  upcoming_reminders: number
  overdue_reminders: number
  total_reminders: number
  analytics: {
    total_students_change: number
    applications_change: number
    communications_change: number
    interactions_change: number
  }
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentInteractions, setRecentInteractions] = useState<any[]>([])

  // Helper function to format time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return `${Math.floor(diffInSeconds / 2592000)} months ago`
  }

  // Use placeholder data for instant loading, but fetch real communications
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      
      // Placeholder students data using real students from database
      const placeholderStudents: Student[] = [
        { id: "EFG3sZTilNca83WhRB5N", name: "Test Student V2", email: "testv2@example.com", country: "USA", status: "Applying", lastActive: new Date(), highIntent: true, needsEssayHelp: false },
        { id: "IWnVRzDxqceByGZBPP8x", name: "Samuel Okoro", email: "samuel.okoro@example.com", country: "Nigeria", status: "Shortlisting", lastActive: new Date(), highIntent: false, needsEssayHelp: true },
        { id: "IYuN6FKgHLzOMOP6QGM8", name: "Aisha Khan", email: "aisha.khan@example.com", country: "Pakistan", status: "Exploring", lastActive: new Date(), highIntent: true, needsEssayHelp: true },
        { id: "student_0", name: "Student 0", email: "student0@example.com", country: "Canada", status: "Submitted", lastActive: new Date(), highIntent: false, needsEssayHelp: false },
        { id: "student_1", name: "Student 1", email: "student1@example.com", country: "UK", status: "Applying", lastActive: new Date(), highIntent: true, needsEssayHelp: false }
      ]
      
      // Fetch real communications count
      let realCommunicationsCount = 0
      try {
        const commResponse = await apiClient.getAllCommunications()
        if (commResponse.success && commResponse.data) {
          realCommunicationsCount = commResponse.data.length
        }
      } catch (error) {
        console.error("Error fetching communications:", error)
      }
      
      // Fetch real interactions count and data
      let realInteractionsCount = 0
      let recentInteractions: any[] = []
      try {
        const interactionsResponse = await apiClient.getAllInteractions()
        if (interactionsResponse.success && interactionsResponse.data) {
          realInteractionsCount = interactionsResponse.data.length
          // Get the 3 most recent interactions
          recentInteractions = interactionsResponse.data.slice(0, 3)
        }
      } catch (error) {
        console.error("Error fetching interactions:", error)
      }
      
      // Placeholder dashboard stats with real communications count
      const placeholderStats: DashboardStats = {
        total_students: 26,
        status_breakdown: { "Exploring": 8, "Shortlisting": 6, "Applying": 7, "Submitted": 5 },
        country_breakdown: { "USA": 8, "India": 6, "Canada": 4, "UAE": 3, "UK": 2, "Australia": 2, "Germany": 1 },
        high_intent_count: 12,
        needs_essay_help_count: 15,
        applications_in_progress: 12,
        total_communications: realCommunicationsCount,
        communications_this_month: realCommunicationsCount,
        total_interactions: realInteractionsCount, // Use real interactions count from database
        active_students_this_week: 21,
        upcoming_reminders: 3,
        overdue_reminders: 1,
        total_reminders: 4,
        analytics: {
          total_students_change: 12.5,
          applications_change: 8.3,
          communications_change: 23.1,
          interactions_change: 15.7
        }
      }
      
      setStudents(placeholderStudents)
      setStats(placeholderStats)
      setRecentInteractions(recentInteractions)
      setLoading(false)
    }

    loadDashboardData()
  }, [])


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


      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.total_students || students.length}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-500 text-xs">
                    {stats?.active_students_this_week || 0} active this week
                  </p>
                  <p className="text-green-600 text-xs font-medium">
                    +{stats?.analytics?.total_students_change || 12}% from last month
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications in Progress Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Applications in Progress</p>
                <p className="text-3xl font-bold text-green-600">{stats?.applications_in_progress || 0}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-500 text-xs">
                    {stats?.status_breakdown?.["Submitted"] || 0} submitted
                  </p>
                  <p className="text-green-600 text-xs font-medium">
                    +{stats?.analytics?.applications_change || 8}% from last month
                  </p>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communications Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Communications</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.total_communications || 0}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-500 text-xs">Total</p>
                  <p className="text-green-600 text-xs font-medium">
                    +{stats?.analytics?.communications_change || 23}% from last month
                  </p>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-purple-600"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <path d="M13 8H7"/>
                  <path d="M17 12H7"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Interactions Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Interactions</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.total_interactions || 0}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-500 text-xs">All time</p>
                  <p className="text-green-600 text-xs font-medium">
                    +{stats?.analytics?.interactions_change || 15}% from last month
                  </p>
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-orange-600"
                >
                  <path d="M3 3v18h18"/>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600 text-xl font-bold">Recent Activity</CardTitle>
            <p className="text-gray-600 text-sm">Latest student interactions and updates</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Real activity data from actual interactions */}
              {recentInteractions.length > 0 ? (
                recentInteractions.map((interaction, index) => {
                  const studentName = interaction.student_name || "Unknown Student"
                  const initials = studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                  const description = interaction.description || "interaction"
                  const createdAt = interaction.created_at ? new Date(interaction.created_at) : new Date()
                  const timeAgo = getTimeAgo(createdAt)
                  
                  const colors = [
                    { bg: "bg-blue-100", text: "text-blue-600" },
                    { bg: "bg-green-100", text: "text-green-600" },
                    { bg: "bg-purple-100", text: "text-purple-600" }
                  ]
                  const color = colors[index % colors.length]
                  
                  return (
                    <div key={interaction.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 ${color.bg} rounded-full flex items-center justify-center ${color.text} font-medium text-sm`}>
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{studentName}</p>
                        <p className="text-gray-600 text-sm">{description}</p>
                        <p className="text-gray-500 text-xs">{timeAgo}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                // Fallback if no interactions
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                    --
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">No recent activity</p>
                    <p className="text-gray-600 text-sm">No interactions found</p>
                    <p className="text-gray-500 text-xs">--</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600 text-xl font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <a href="/communications" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <p className="text-blue-600 font-medium">Send Bulk Email</p>
                <p className="text-gray-600 text-sm">Send updates to all students</p>
              </a>
              
              <a href="/tasks" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <p className="text-blue-600 font-medium">Schedule Follow-ups</p>
                <p className="text-gray-600 text-sm">Set reminders for inactive students</p>
              </a>
              
              <a href="/students" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <p className="text-blue-600 font-medium">Generate Report</p>
                <p className="text-gray-600 text-sm">Monthly progress summary</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

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