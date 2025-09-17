import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  filters?: {
    status?: string[]
    country?: string[]
    highIntent?: boolean
    needsEssayHelp?: boolean
    dateRange?: {
      start: string
      end: string
    }
  }
  fields?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const options: ExportOptions = await request.json()
    
    // Get students data
    const students = await getStudentsForExport(options)
    
    // Generate export based on format
    let exportData: string
    let contentType: string
    let filename: string

    switch (options.format) {
      case 'csv':
        exportData = generateCSV(students, options.fields)
        contentType = 'text/csv'
        filename = `students_export_${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'json':
        exportData = JSON.stringify(students, null, 2)
        contentType = 'application/json'
        filename = `students_export_${new Date().toISOString().split('T')[0]}.json`
        break
      case 'xlsx':
        // For Excel, we'll return JSON and let frontend handle conversion
        exportData = JSON.stringify(students)
        contentType = 'application/json'
        filename = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`
        break
      default:
        return NextResponse.json(
          { error: "Invalid format. Use 'csv', 'json', or 'xlsx'" },
          { status: 400 }
        )
    }

    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export students data" },
      { status: 500 }
    )
  }
}

async function getStudentsForExport(options: ExportOptions) {
  let q = query(collection(db, "students"), orderBy("createdAt", "desc"))

  // Apply filters
  if (options.filters?.status?.length) {
    q = query(q, where("status", "in", options.filters.status))
  }

  if (options.filters?.country?.length) {
    q = query(q, where("country", "in", options.filters.country))
  }

  if (options.filters?.highIntent !== undefined) {
    q = query(q, where("highIntent", "==", options.filters.highIntent))
  }

  if (options.filters?.needsEssayHelp !== undefined) {
    q = query(q, where("needsEssayHelp", "==", options.filters.needsEssayHelp))
  }

  const snapshot = await getDocs(q)
  const students = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    lastActive: doc.data().lastActive?.toDate?.()?.toISOString() || null,
    lastContactedAt: doc.data().lastContactedAt?.toDate?.()?.toISOString() || null
  }))

  // Apply date range filter
  if (options.filters?.dateRange) {
    const { start, end } = options.filters.dateRange
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    return students.filter(student => {
      const createdAt = new Date(student.createdAt || 0)
      return createdAt >= startDate && createdAt <= endDate
    })
  }

  return students
}

function generateCSV(students: any[], fields?: string[]) {
  const defaultFields = [
    'id', 'name', 'email', 'phone', 'grade', 'country', 'status',
    'highIntent', 'needsEssayHelp', 'createdAt', 'lastActive', 'lastContactedAt'
  ]
  
  const selectedFields = fields || defaultFields
  
  // CSV header
  const header = selectedFields.join(',')
  
  // CSV rows
  const rows = students.map(student => {
    return selectedFields.map(field => {
      const value = student[field] || ''
      // Escape commas and quotes in CSV
      const escapedValue = typeof value === 'string' 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
      return escapedValue
    }).join(',')
  })
  
  return [header, ...rows].join('\n')
}
