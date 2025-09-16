"use client"


import { useEffect, useState, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { collection, addDoc, onSnapshot } from "firebase/firestore"

interface Student {
  id: string
  name: string
  email: string
  country: string
  status: string
  lastActive: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // ✅ Real-time listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const studentsData: Student[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[]
      setStudents(studentsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const newStudent = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      country: formData.get("country") as string,
      status: formData.get("status") as string, // ✅ dynamic status
      lastActive: new Date().toISOString().split("T")[0],
    }

    await addDoc(collection(db, "students"), newStudent)

    formRef.current.reset()
    setOpen(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form
              ref={formRef}
              className="flex flex-col gap-4 mt-4"
              onSubmit={handleAddStudent}
            >
              <Input name="name" placeholder="Name" required />
              <Input name="email" placeholder="Email" required />
              <Input name="country" placeholder="Country" required />

              {/* ✅ Status dropdown */}
              <select
                name="status"
                className="border rounded p-2"
                defaultValue="Exploring"
                required
              >
                <option value="Exploring">Exploring</option>
                <option value="Applying">Applying</option>
                <option value="Shortlisting">Shortlisting</option>
                <option value="Admitted">Admitted</option>
              </select>

              <Button type="submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <a
                    href={`/students/${s.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {s.name}
                  </a>
                </TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.country}</TableCell>
                <TableCell>{s.status}</TableCell>
                <TableCell>{s.lastActive}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}