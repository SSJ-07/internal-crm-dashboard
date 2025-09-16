"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Student {
  id: string
  name: string
  email: string
  country: string
  status: string
  lastActive: string
  notes?: string
}

export default function StudentProfilePage() {
  const params = useParams()
  const { id } = params // ID from URL
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return
      const docRef = doc(db, "students", id as string)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setStudent({ id: docSnap.id, ...docSnap.data() } as Student)
      } else {
        setStudent(null)
      }
      setLoading(false)
    }
    fetchStudent()
  }, [id])

  if (loading) return <p>Loading...</p>
  if (!student) return <p>No student found.</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{student.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Country:</strong> {student.country}</p>
          <p><strong>Status:</strong> {student.status}</p>
          <p><strong>Last Active:</strong> {student.lastActive}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            <li>Account created</li>
            <li>Submitted first essay draft</li>
            <li>Had a call with mentor</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{student.notes || "No notes yet."}</p>
        </CardContent>
      </Card>
    </div>
  )
}