"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { db, auth } from "@/lib/firebase"
import { doc, onSnapshot, serverTimestamp, updateDoc, collection, addDoc, query, orderBy, deleteDoc } from "firebase/firestore"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  grade?: string
  country: string
  status: string
  lastActive: any
  notes?: string
}

interface InteractionItem {
  id: string
  type: string
  detail?: string
  createdAt: any
}

interface CommunicationItem {
  id: string
  channel: "email" | "sms" | "call"
  subject?: string
  body?: string
  createdAt: any
}

interface NoteItem {
  id: string
  text: string
  createdAt: any
}

export default function StudentProfilePage() {
  const params = useParams()
  const { id } = params // ID from URL
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [interactions, setInteractions] = useState<InteractionItem[]>([])
  const [newType, setNewType] = useState("login")
  const [newDetail, setNewDetail] = useState("")
  const [communications, setCommunications] = useState<CommunicationItem[]>([])
  const [commChannel, setCommChannel] = useState<"email" | "sms" | "call">("email")
  const [commSubject, setCommSubject] = useState("")
  const [commBody, setCommBody] = useState("")
  const [permError, setPermError] = useState<string | null>(null)
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [noteText, setNoteText] = useState("")

  useEffect(() => {
    if (!id) return
    const ref = doc(db, "students", id as string)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setStudent({ id: snap.id, ...snap.data() } as Student)
          setLoading(false)
        } else {
          setStudent(null)
          setLoading(false)
        }
      },
      () => setLoading(false)
    )
    // Mark last active on view
    updateDoc(ref, { lastActive: serverTimestamp() }).catch(() => {})
    return () => unsub()
  }, [id])

  const stageProgress = useMemo(() => {
    const stages = ["Exploring", "Shortlisting", "Applying", "Submitted"]
    const idx = student ? stages.indexOf(student.status || "") : -1
    const percent = idx >= 0 ? ((idx + 1) / stages.length) * 100 : 0
    return { stages, idx, percent }
  }, [student])

  // Interactions realtime
  useEffect(() => {
    if (!id) return
    const interactionsRef = collection(db, "students", id as string, "interactions")
    const q = query(interactionsRef, orderBy("createdAt", "desc"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: InteractionItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setInteractions(items)
      },
      (err) => {
        console.error("Interactions listener error", err)
        setPermError("Missing or insufficient permissions to read interactions.")
      }
    )
    return () => unsub()
  }, [id])

  const addInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    const interactionsRef = collection(db, "students", id as string, "interactions")
    await addDoc(interactionsRef, {
      type: newType,
      detail: newDetail,
      createdAt: serverTimestamp(),
    })
    setNewDetail("")
  }

  // Communications realtime
  useEffect(() => {
    if (!id) return
    const ref = collection(db, "students", id as string, "communications")
    const q = query(ref, orderBy("createdAt", "desc"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: CommunicationItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setCommunications(items)
      },
      (err) => {
        console.error("Communications listener error", err)
        setPermError("Missing or insufficient permissions to read communications.")
      }
    )
    return () => unsub()
  }, [id])

  const addCommunication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    const subjectTrimmed = (commSubject || "").trim()
    const bodyTrimmed = (commBody || "").trim()
    const hasContent = subjectTrimmed.length > 0 || bodyTrimmed.length > 0
    if (!hasContent) {
      alert("Please enter a subject or message (or call summary) before logging.")
      return
    }

    try {
      // If it's an email, send it first
      if (commChannel === "email") {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            to: student?.email || "", 
            subject: subjectTrimmed, 
            html: bodyTrimmed, 
            fromName: (auth.currentUser?.displayName || "CRM Team")
          }),
        })
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({}))
          alert(`Failed to send email: ${error?.error || res.statusText}`)
          return
        }
      }

      // Log the communication
      const ref = collection(db, "students", id as string, "communications")
      const payload: any = {
        channel: commChannel,
        createdAt: serverTimestamp(),
      }
      if (subjectTrimmed) payload.subject = subjectTrimmed
      if (bodyTrimmed) payload.body = bodyTrimmed
      await addDoc(ref, payload)
      
      // bump lastContactedAt on student
      await updateDoc(doc(db, "students", id as string), {
        lastContactedAt: serverTimestamp(),
      }).catch(() => {})
      
      setCommSubject("")
      setCommBody("")
      
      if (commChannel === "email") {
        alert("Email sent and logged!")
      } else {
        alert("Communication logged!")
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const sendMockFollowUpEmail = async () => {
    if (!id || !student?.email) return
    const subject = "Follow-up: Next steps on your application"
    const html = `<p>Hi ${student.name || ''},</p><p>Just checking in to see if you need help with essays or documents.</p><p>Best regards,<br>Your CRM Team</p>`
    
    try {
      // Send real email
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: student.email, 
          subject, 
          html, 
          fromName: (auth.currentUser?.displayName || "CRM Team")
        }),
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        alert(`Failed to send email: ${error?.error || res.statusText}`)
        return
      }
      
      // Log the communication
      const ref = collection(db, "students", id as string, "communications")
      await addDoc(ref, { 
        channel: "email", 
        subject, 
        body: html, 
        createdAt: serverTimestamp() 
      })
      await updateDoc(doc(db, "students", id as string), { 
        lastContactedAt: serverTimestamp() 
      }).catch(() => {})
      
      alert("Follow-up email sent and logged!")
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const scheduleReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id) return
    const formData = new FormData(e.currentTarget)
    const title = (formData.get("title") as string) || "Follow up"
    const due = formData.get("due") as string
    await addDoc(collection(db, "tasks"), {
      title,
      due,
      status: "Pending",
      studentId: id,
      createdAt: serverTimestamp(),
    })
    alert("Reminder scheduled and added to Tasks.")
    e.currentTarget.reset()
  }

  // Notes realtime
  useEffect(() => {
    if (!id) return
    const ref = collection(db, "students", id as string, "notes")
    const q = query(ref, orderBy("createdAt", "desc"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: NoteItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setNotes(items)
      },
      (err) => {
        console.error("Notes listener error", err)
        setPermError("Missing or insufficient permissions to read notes.")
      }
    )
    return () => unsub()
  }, [id])

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteText.trim()) return
    const ref = collection(db, "students", id as string, "notes")
    await addDoc(ref, { text: noteText.trim(), createdAt: serverTimestamp() })
    setNoteText("")
  }

  const deleteNote = async (noteId: string) => {
    if (!id) return
    await deleteDoc(doc(db, "students", id as string, "notes", noteId))
  }

  if (loading) return <p>Loading...</p>
  if (!student) return <p>No student found.</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{student.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Phone:</strong> {student.phone || "—"}</p>
            <p><strong>Grade:</strong> {student.grade || "—"}</p>
            <p><strong>Country:</strong> {student.country}</p>
            <p><strong>Status:</strong> {student.status}</p>
            <p><strong>Last Active:</strong> {student?.lastActive?.toDate ? student.lastActive.toDate().toISOString().split("T")[0] : (typeof student.lastActive === "string" ? student.lastActive : "—")}</p>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              {stageProgress.stages.map((s, i) => (
                <span key={s} className={i <= stageProgress.idx ? "font-semibold" : "text-gray-500"}>{s}</span>
              ))}
            </div>
            <div className="h-2 w-full bg-gray-200 rounded">
              <div className="h-2 bg-blue-600 rounded" style={{ width: `${stageProgress.percent}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {permError && (
            <p className="text-sm text-red-600 mb-2">{permError}</p>
          )}
          <form onSubmit={addInteraction} className="flex flex-col md:flex-row gap-2 mb-4">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="border rounded p-2"
            >
              <option value="login">Login</option>
              <option value="ai_question">AI Question</option>
              <option value="document_submitted">Document Submitted</option>
              <option value="other">Other</option>
            </select>
            <Input
              placeholder="Details (optional)"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>
          {interactions.length === 0 ? (
            <p className="text-sm text-gray-500">No interactions yet.</p>
          ) : (
            <ul className="space-y-2">
              {interactions.map((it) => (
                <li key={it.id} className="border rounded p-2 bg-white">
                  <div className="text-sm">
                    <strong className="capitalize">{it.type.replaceAll("_", " ")}</strong>
                    {it.detail ? <span>: {it.detail}</span> : null}
                  </div>
                  <div className="text-xs text-gray-500">
                    {it.createdAt?.toDate ? it.createdAt.toDate().toLocaleString() : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Log</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addCommunication} className="flex flex-col gap-2 mb-4">
            <div className="flex gap-2">
              <select value={commChannel} onChange={(e) => setCommChannel(e.target.value as any)} className="border rounded p-2">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="call">Call</option>
              </select>
              {commChannel !== "call" && (
                <Input placeholder="Subject (optional)" value={commSubject} onChange={(e) => setCommSubject(e.target.value)} />
              )}
            </div>
            <textarea
              className="border rounded p-2 min-h-24"
              placeholder={commChannel === "call" ? "Call summary" : "Message body"}
              value={commBody}
              onChange={(e) => setCommBody(e.target.value)}
            />
            <Button type="submit">Log Communication</Button>
          </form>
          {communications.length === 0 ? (
            <p className="text-sm text-gray-500">No communications yet.</p>
          ) : (
            <ul className="space-y-2">
              {communications.map((c) => (
                <li key={c.id} className="border rounded p-2 bg-white">
                  <div className="text-sm"><strong className="uppercase">{c.channel}</strong>{c.subject ? ` · ${c.subject}` : ""}</div>
                  {c.body ? <div className="text-sm whitespace-pre-wrap">{c.body}</div> : null}
                  <div className="text-xs text-gray-500">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : "—"}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <Button onClick={sendMockFollowUpEmail}>Send Follow-up Email</Button>
            </div>
            <form onSubmit={scheduleReminder} className="flex flex-col md:flex-row gap-2">
              <Input name="title" placeholder="Reminder title" />
              <Input name="due" type="date" required />
              <Button type="submit">Schedule Reminder</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addNote} className="flex flex-col md:flex-row gap-2 mb-4">
            <Input placeholder="Add a note" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <Button type="submit">Add Note</Button>
          </form>
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="border rounded p-2 bg-white flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm whitespace-pre-wrap">{n.text}</div>
                    <div className="text-xs text-gray-500">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : "—"}</div>
                  </div>
                  <Button variant="outline" onClick={() => deleteNote(n.id)}>Delete</Button>
                </li>
              ))}
            </ul>
          )}
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