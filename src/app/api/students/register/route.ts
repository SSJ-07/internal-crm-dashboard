import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"

interface StudentRegistrationData {
  name: string
  email: string
  phone?: string
  grade?: string
  country: string
  source?: string // Where they came from (website, referral, etc.)
  additionalData?: any // Any extra data from your website
}

export async function POST(request: NextRequest) {
  try {
    const studentData: StudentRegistrationData = await request.json()
    
    // Validate required fields
    if (!studentData.name || !studentData.email || !studentData.country) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, country" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(studentData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check for duplicate email
    const existingStudentQuery = query(
      collection(db, "students"),
      where("email", "==", studentData.email)
    )
    const existingStudents = await getDocs(existingStudentQuery)
    
    if (!existingStudents.empty) {
      return NextResponse.json(
        { error: "Student with this email already exists" },
        { status: 409 }
      )
    }

    // Create new student
    const newStudent = {
      name: studentData.name,
      email: studentData.email,
      phone: studentData.phone || null,
      grade: studentData.grade || null,
      country: studentData.country,
      status: "Exploring", // Default status for new registrations
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
      lastContactedAt: null,
      highIntent: false,
      needsEssayHelp: false,
      source: studentData.source || "Website Registration",
      additionalData: studentData.additionalData || null
    }

    const docRef = await addDoc(collection(db, "students"), newStudent)

    return NextResponse.json({
      success: true,
      studentId: docRef.id,
      message: "Student registered successfully"
    })

  } catch (error) {
    console.error("Student registration error:", error)
    return NextResponse.json(
      { error: "Failed to register student" },
      { status: 500 }
    )
  }
}
