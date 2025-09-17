import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, startAfter } from "firebase/firestore"

interface SearchOptions {
  query: string
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
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastActive' | 'lastContactedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  page?: number
}

interface SearchResult {
  students: any[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

export async function POST(request: NextRequest) {
  try {
    const options: SearchOptions = await request.json()
    
    if (!options.query || options.query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      )
    }

    const result = await searchStudents(options)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    )
  }
}

async function searchStudents(options: SearchOptions): Promise<SearchResult> {
  const searchQuery = options.query.toLowerCase()
  const pageSize = options.limit || 20
  const currentPage = options.page || 1
  const offset = (currentPage - 1) * pageSize

  // Get all students (Firestore doesn't support full-text search)
  let q = query(collection(db, "students"))
  
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
  let students = snapshot.docs.map(doc => ({
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
    
    students = students.filter(student => {
      const createdAt = new Date(student.createdAt || 0)
      return createdAt >= startDate && createdAt <= endDate
    })
  }

  // Client-side search (since Firestore doesn't support full-text search)
  const searchResults = students.filter(student => {
    const searchableText = [
      student.name,
      student.email,
      student.phone,
      student.grade,
      student.country,
      student.status
    ].join(' ').toLowerCase()

    return searchableText.includes(searchQuery)
  })

  // Sort results
  if (options.sortBy) {
    searchResults.sort((a, b) => {
      let aValue = a[options.sortBy!]
      let bValue = b[options.sortBy!]

      // Handle date sorting
      if (options.sortBy === 'createdAt' || options.sortBy === 'lastActive' || options.sortBy === 'lastContactedAt') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (options.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
    })
  }

  // Pagination
  const total = searchResults.length
  const totalPages = Math.ceil(total / pageSize)
  const paginatedResults = searchResults.slice(offset, offset + pageSize)

  return {
    students: paginatedResults,
    total,
    page: currentPage,
    totalPages,
    hasMore: currentPage < totalPages
  }
}
