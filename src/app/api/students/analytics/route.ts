import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

interface AnalyticsOptions {
  dateRange?: {
    start: string
    end: string
  }
  groupBy?: 'day' | 'week' | 'month'
}

interface StudentAnalytics {
  overview: {
    totalStudents: number
    newStudents: number
    activeStudents: number
    highIntentStudents: number
    needsEssayHelpStudents: number
  }
  statusBreakdown: {
    exploring: number
    shortlisting: number
    applying: number
    submitted: number
  }
  countryBreakdown: Array<{
    country: string
    count: number
    percentage: number
  }>
  engagementMetrics: {
    averageDaysSinceLastContact: number
    studentsNotContactedIn7Days: number
    studentsNotContactedIn30Days: number
    communicationRate: number
  }
  trends: {
    dailyRegistrations: Array<{
      date: string
      count: number
    }>
    statusProgression: Array<{
      from: string
      to: string
      count: number
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const options: AnalyticsOptions = await request.json()
    
    const analytics = await generateStudentAnalytics(options)
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    )
  }
}

async function generateStudentAnalytics(options: AnalyticsOptions): Promise<StudentAnalytics> {
  // Get all students
  const snapshot = await getDocs(collection(db, "students"))
  let students = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    lastActive: doc.data().lastActive?.toDate?.() || new Date(),
    lastContactedAt: doc.data().lastContactedAt?.toDate?.() || null
  }))

  // Apply date range filter
  if (options.dateRange) {
    const { start, end } = options.dateRange
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    students = students.filter(student => {
      const createdAt = new Date(student.createdAt)
      return createdAt >= startDate && createdAt <= endDate
    })
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Overview metrics
  const totalStudents = students.length
  const newStudents = students.filter(s => 
    new Date(s.createdAt) >= sevenDaysAgo
  ).length
  const activeStudents = students.filter(s => 
    new Date(s.lastActive) >= sevenDaysAgo
  ).length
  const highIntentStudents = students.filter(s => s.highIntent).length
  const needsEssayHelpStudents = students.filter(s => s.needsEssayHelp).length

  // Status breakdown
  const statusBreakdown = {
    exploring: students.filter(s => s.status === 'Exploring').length,
    shortlisting: students.filter(s => s.status === 'Shortlisting').length,
    applying: students.filter(s => s.status === 'Applying').length,
    submitted: students.filter(s => s.status === 'Submitted').length
  }

  // Country breakdown
  const countryCounts = students.reduce((acc, student) => {
    const country = student.country || 'Unknown'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const countryBreakdown = Object.entries(countryCounts)
    .map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / totalStudents) * 100)
    }))
    .sort((a, b) => b.count - a.count)

  // Engagement metrics
  const studentsWithContact = students.filter(s => s.lastContactedAt)
  const averageDaysSinceLastContact = studentsWithContact.length > 0
    ? studentsWithContact.reduce((sum, s) => {
        const daysSince = Math.floor((now.getTime() - new Date(s.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
        return sum + daysSince
      }, 0) / studentsWithContact.length
    : 0

  const studentsNotContactedIn7Days = students.filter(s => {
    if (!s.lastContactedAt) return true
    return new Date(s.lastContactedAt) < sevenDaysAgo
  }).length

  const studentsNotContactedIn30Days = students.filter(s => {
    if (!s.lastContactedAt) return true
    return new Date(s.lastContactedAt) < thirtyDaysAgo
  }).length

  // Communication rate (students contacted in last 7 days / total students)
  const communicationRate = totalStudents > 0 
    ? Math.round(((totalStudents - studentsNotContactedIn7Days) / totalStudents) * 100)
    : 0

  // Trends - Daily registrations
  const dailyRegistrations = generateDailyRegistrations(students, options.groupBy || 'day')

  // Status progression (simplified - would need more complex tracking)
  const statusProgression = [
    { from: 'Exploring', to: 'Shortlisting', count: 0 },
    { from: 'Shortlisting', to: 'Applying', count: 0 },
    { from: 'Applying', to: 'Submitted', count: 0 }
  ]

  return {
    overview: {
      totalStudents,
      newStudents,
      activeStudents,
      highIntentStudents,
      needsEssayHelpStudents
    },
    statusBreakdown,
    countryBreakdown,
    engagementMetrics: {
      averageDaysSinceLastContact: Math.round(averageDaysSinceLastContact),
      studentsNotContactedIn7Days,
      studentsNotContactedIn30Days,
      communicationRate
    },
    trends: {
      dailyRegistrations,
      statusProgression
    }
  }
}

function generateDailyRegistrations(students: any[], groupBy: 'day' | 'week' | 'month') {
  const registrations: Record<string, number> = {}
  
  students.forEach(student => {
    const date = new Date(student.createdAt)
    let key: string
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
    }
    
    registrations[key] = (registrations[key] || 0) + 1
  })
  
  return Object.entries(registrations)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
