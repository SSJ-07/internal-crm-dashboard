import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"

interface StudentImportData {
  name: string
  email: string
  phone?: string
  grade?: string
  country: string
  status: string
  highIntent?: boolean
  needsEssayHelp?: boolean
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{
    row: number
    email: string
    error: string
  }>
  warnings: Array<{
    row: number
    email: string
    warning: string
  }>
  summary?: {
    total: number
    imported: number
    skipped: number
    validationErrors: number
    otherErrors: number
    duplicateErrors: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { students, validateOnly = false } = await request.json()
    
    console.log("Bulk import request:", { studentsCount: students?.length, validateOnly })
    
    if (!Array.isArray(students)) {
      console.error("Invalid students data:", students)
      return NextResponse.json(
        { error: "Students data must be an array" },
        { status: 400 }
      )
    }

    const result = await processBulkImport(students, validateOnly)
    
    console.log("Bulk import result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Bulk import error:", error)
    return NextResponse.json(
      { error: `Failed to process bulk import: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

async function processBulkImport(
  students: StudentImportData[],
  validateOnly: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: []
  }

  // Track different types of failures
  let validationErrors = 0
  let duplicateErrors = 0
  let otherErrors = 0

  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    const row = i + 1

    try {
      // Validate student data
      const validation = validateStudentData(student)
      
      if (!validation.isValid) {
        result.failed++
        validationErrors++
        result.errors.push({
          row,
          email: student.email || "Unknown",
          error: validation.errors.join(", ")
        })
        continue
      }

      // Add warnings
      if (validation.warnings.length > 0) {
        result.warnings.push({
          row,
          email: student.email,
          warning: validation.warnings.join(", ")
        })
      }

      // Skip if validation only
      if (validateOnly) {
        result.imported++
        continue
      }

      // Check for duplicate email
      const isDuplicate = await checkDuplicateEmail(student.email)
      if (isDuplicate) {
        result.failed++
        duplicateErrors++
        result.errors.push({
          row,
          email: student.email,
          error: "Duplicate email - student already exists"
        })
        continue
      }

      // Import student
      await addDoc(collection(db, "students"), {
        ...student,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        lastContactedAt: null
      })

      result.imported++
    } catch (error) {
      result.failed++
      otherErrors++
      result.errors.push({
        row,
        email: student.email || "Unknown",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  // Update success status - consider it successful if we imported at least some students
  result.success = result.imported > 0

  // Add summary information to the result
  result.summary = {
    total: students.length,
    imported: result.imported,
    skipped: duplicateErrors,
    validationErrors,
    otherErrors,
    duplicateErrors
  }

  return result
}

function validateStudentData(data: StudentImportData) {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields with simple error messages
  if (!data.name || data.name.trim().length < 2) {
    errors.push("Invalid student name")
  }

  if (!data.email) {
    errors.push("Missing email address")
  } else if (!isValidEmail(data.email)) {
    errors.push("Invalid email format")
  }

  if (!data.country || data.country.trim().length < 2) {
    errors.push("Invalid country")
  }

  if (!data.status) {
    errors.push("Missing student status")
  } else if (!isValidStatus(data.status)) {
    errors.push("Unsupported student status")
  }

  // Optional field validation with simple warnings
  if (data.phone && !isValidPhone(data.phone)) {
    warnings.push("Phone number format may be invalid")
  }

  if (data.grade && !isValidGrade(data.grade)) {
    warnings.push("Grade format may be invalid")
  }

  // Check for extra fields that might cause issues
  const allowedFields = ['name', 'email', 'phone', 'grade', 'country', 'status', 'highIntent', 'needsEssayHelp']
  const extraFields = Object.keys(data).filter(key => !allowedFields.includes(key))
  if (extraFields.length > 0) {
    warnings.push(`Extra fields found: ${extraFields.join(', ')} (ignored)`)
  }

  return { isValid: errors.length === 0, errors, warnings }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

function isValidGrade(grade: string): boolean {
  const gradeRegex = /^(9th|10th|11th|12th|Freshman|Sophomore|Junior|Senior|\d{1,2}(th|st|nd|rd)?)$/i
  return gradeRegex.test(grade)
}

function isValidStatus(status: string): boolean {
  const validStatuses = ["Exploring", "Shortlisting", "Applying", "Submitted"]
  return validStatuses.includes(status)
}

async function checkDuplicateEmail(email: string): Promise<boolean> {
  try {
    const q = query(collection(db, "students"), where("email", "==", email))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("Error checking duplicate email:", error)
    return false // If we can't check, allow the import to proceed
  }
}
