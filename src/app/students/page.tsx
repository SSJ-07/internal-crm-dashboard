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
import { Input as TextInput } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore"

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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // UI state: filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("__all")
  const [countryFilter, setCountryFilter] = useState<string>("")
  const [notContacted7d, setNotContacted7d] = useState(false)
  const [highIntent, setHighIntent] = useState(false)
  const [needsEssayHelp, setNeedsEssayHelp] = useState(false)

  // ✅ Real-time listener (no sort to include legacy docs without createdAt)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "students"),
      (snapshot) => {
        const studentsData: Student[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[]
        setStudents(studentsData)
        setLoading(false)
      },
      (error) => {
        console.error("Students listener error:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Helper functions to classify students
  const isNotContactedIn7Days = (student: Student) => {
    if (!student.lastContactedAt) return true // Never contacted
    const lastContacted = student.lastContactedAt?.toDate?.() || student.lastContactedAt
    const lastContactedMs = lastContacted instanceof Date ? lastContacted.getTime() : 0
    return Date.now() - lastContactedMs > 7 * 24 * 60 * 60 * 1000
  }

  const isHighIntent = (student: Student) => {
    return Boolean(student.highIntent)
  }

  const isNeedsEssayHelp = (student: Student) => {
    return Boolean(student.needsEssayHelp)
  }

  const isInEssayStage = (student: Student) => {
    return student.status === "Applying" || student.status === "Submitted"
  }

  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const newStudent = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      country: formData.get("country") as string,
      status: formData.get("status") as string, // constrained options below
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
      lastContactedAt: serverTimestamp(),
      highIntent: false,
      needsEssayHelp: false,
    }

    await addDoc(collection(db, "students"), newStudent)

    formRef.current.reset()
    setOpen(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
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

              {/* Status dropdown aligned to spec */}
              <select name="status" className="border rounded p-2" defaultValue="Exploring" required>
                <option value="Exploring">Exploring</option>
                <option value="Shortlisting">Shortlisting</option>
                <option value="Applying">Applying</option>
                <option value="Submitted">Submitted</option>
              </select>

              <Button type="submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <TextInput
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size="sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Statuses</SelectItem>
            <SelectItem value="Exploring">Exploring</SelectItem>
            <SelectItem value="Shortlisting">Shortlisting</SelectItem>
            <SelectItem value="Applying">Applying</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
          </SelectContent>
        </Select>
        <TextInput
          placeholder="Country"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="w-40"
        />

        {/* Quick filters */}
        <Button variant={notContacted7d ? "default" : "outline"} onClick={() => setNotContacted7d(!notContacted7d)}>
          Not contacted in 7 days
        </Button>
        <Button variant={highIntent ? "default" : "outline"} onClick={() => setHighIntent(!highIntent)}>
          High intent
        </Button>
        <Button variant={needsEssayHelp ? "default" : "outline"} onClick={() => setNeedsEssayHelp(!needsEssayHelp)}>
          Needs essay help
        </Button>
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          <span className="px-3 py-1 rounded-full bg-white border">Total: {students.length}</span>
          <span className="px-3 py-1 rounded-full bg-white border">Exploring: {students.filter(s => s.status === "Exploring").length}</span>
          <span className="px-3 py-1 rounded-full bg-white border">Shortlisting: {students.filter(s => s.status === "Shortlisting").length}</span>
          <span className="px-3 py-1 rounded-full bg-white border">Applying: {students.filter(s => s.status === "Applying").length}</span>
          <span className="px-3 py-1 rounded-full bg-white border">Submitted: {students.filter(s => s.status === "Submitted").length}</span>
        </div>
      )}

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
            {students
              .filter((s) => {
                const text = `${s.name} ${s.email}`.toLowerCase()
                const matchesSearch = text.includes(search.toLowerCase())
                const matchesStatus = statusFilter === "__all" ? true : s.status === statusFilter
                const matchesCountry = countryFilter
                  ? (s.country || "").toLowerCase().includes(countryFilter.toLowerCase())
                  : true
                let matchesQuick = true
                if (notContacted7d) {
                  matchesQuick = matchesQuick && isNotContactedIn7Days(s)
                }
                if (highIntent) {
                  matchesQuick = matchesQuick && isHighIntent(s)
                }
                if (needsEssayHelp) {
                  matchesQuick = matchesQuick && isNeedsEssayHelp(s)
                }
                return matchesSearch && matchesStatus && matchesCountry && matchesQuick
              })
              .map((s) => (
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
                <TableCell>{
                  // Firestore Timestamp -> readable date
                  s?.lastActive?.toDate
                    ? s.lastActive.toDate().toISOString().split("T")[0]
                    : typeof s.lastActive === "string"
                      ? s.lastActive
                      : "—"
                }</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}