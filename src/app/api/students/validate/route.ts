import { NextRequest, NextResponse } from "next/server"

interface StudentData {
  name: string
  email: string
  phone?: string
  grade?: string
  country: string
  status: string
  highIntent?: boolean
  needsEssayHelp?: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export async function POST(request: NextRequest) {
  try {
    const studentData: StudentData = await request.json()
    const validation = validateStudentData(studentData)
    
    return NextResponse.json(validation)
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    )
  }
}

function validateStudentData(data: StudentData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters")
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push("Valid email is required")
  }

  if (!data.country || data.country.trim().length < 2) {
    errors.push("Country is required")
  }

  if (!data.status || !isValidStatus(data.status)) {
    errors.push("Status must be one of: Exploring, Shortlisting, Applying, Submitted")
  }

  // Optional fields validation
  if (data.phone && !isValidPhone(data.phone)) {
    warnings.push("Phone number format may be invalid")
  }

  if (data.grade && !isValidGrade(data.grade)) {
    warnings.push("Grade format may be invalid")
  }

  // Email domain validation
  if (data.email && !isValidEmailDomain(data.email)) {
    warnings.push("Email domain may be invalid or suspicious")
  }

  // Name validation
  if (data.name && data.name.length > 100) {
    errors.push("Name is too long (max 100 characters)")
  }

  // Country validation
  if (data.country && data.country.length > 50) {
    errors.push("Country name is too long (max 50 characters)")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
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

function isValidEmailDomain(email: string): boolean {
  const suspiciousDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  return !suspiciousDomains.includes(domain || '')
}
