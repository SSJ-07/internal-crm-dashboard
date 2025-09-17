"use client"

import { useEffect, useMemo, useState, useRef } from "react"
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
  lastContactedAt?: any
  highIntent?: boolean
  needsEssayHelp?: boolean
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
  const taskFormRef = useRef<HTMLFormElement>(null)
  const [aiSummary, setAiSummary] = useState<string>("")
  const [generatingSummary, setGeneratingSummary] = useState(false)

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
    const title = (formData.get("reminderTitle") as string) || "Follow up"
    const due = formData.get("reminderDue") as string
    
    // Ensure date is in YYYY-MM-DD format for proper comparison
    const formattedDue = new Date(due).toISOString().split('T')[0]
    
    const reminder = {
      title,
      due: formattedDue,
      studentId: id,
      studentName: student?.name || "Unknown Student",
      createdAt: serverTimestamp(),
      type: "reminder",
      createdBy: auth.currentUser?.email || "Unknown",
    }
    
    try {
      // Store in a separate reminders collection for personal use
      await addDoc(collection(db, "reminders"), reminder)
      alert("Personal reminder scheduled successfully!")
      e.currentTarget.reset()
    } catch (error) {
      console.error("Error scheduling reminder:", error)
      alert("Error scheduling reminder. Please try again.")
    }
  }

  const scheduleTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id) return
    const formData = new FormData(e.currentTarget)
    const title = (formData.get("taskTitle") as string) || "Follow up"
    const due = formData.get("taskDue") as string
    await addDoc(collection(db, "tasks"), {
      title,
      due,
      status: "Pending",
      studentId: id,
      studentName: student?.name || "Unknown Student",
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.email || "Unknown",
    })
    alert("Task scheduled and added to shared Tasks.")
    if (taskFormRef.current) {
      taskFormRef.current.reset()
    }
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

  const generateAISummary = async () => {
    if (!student) return
    
    setGeneratingSummary(true)
    
    try {
      // Collect all relevant data for the summary
      const lastContacted = student.lastContactedAt?.toDate?.() || student.lastContactedAt
      const lastContactedDate = lastContacted instanceof Date ? lastContacted.toLocaleDateString() : "Never"
      
      const recentCommunications = communications.slice(0, 3).map(c => ({
        channel: c.channel,
        subject: c.subject,
        body: c.body?.substring(0, 100) + (c.body && c.body.length > 100 ? "..." : ""),
        date: c.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"
      }))
      
      const recentInteractions = interactions.slice(0, 3).map(i => ({
        type: i.type.replaceAll("_", " "),
        detail: i.detail,
        date: i.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"
      }))
      
      const recentNotes = notes.slice(0, 3).map(n => ({
        text: n.text.substring(0, 100) + (n.text.length > 100 ? "..." : ""),
        date: n.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"
      }))
      
      // Generate AI summary based on available data
      let summary = `**Student Profile Summary for ${student.name}**\n\n`
      
      // Basic info
      summary += `**Current Status:** ${student.status}\n`
      summary += `**Country:** ${student.country}\n`
      summary += `**Last Contacted:** ${lastContactedDate}\n`
      summary += `**Grade:** ${student.grade || "Not specified"}\n\n`
      
      // Classification flags
      if (student.highIntent || student.needsEssayHelp) {
        summary += `**Key Classifications:**\n`
        if (student.highIntent) summary += `• High Intent Student - Priority candidate\n`
        if (student.needsEssayHelp) summary += `• Needs Essay Help - Requires additional support\n`
        summary += `\n`
      }
      
      // Progress analysis
      const stageProgress = ["Exploring", "Shortlisting", "Applying", "Submitted"]
      const currentStageIndex = stageProgress.indexOf(student.status)
      const progressPercent = ((currentStageIndex + 1) / stageProgress.length) * 100
      
      summary += `**Application Progress:** ${progressPercent.toFixed(0)}% complete\n`
      summary += `• Currently in: ${student.status} stage\n`
      if (currentStageIndex < stageProgress.length - 1) {
        summary += `• Next stage: ${stageProgress[currentStageIndex + 1]}\n`
      } else {
        summary += `• Application completed!\n`
      }
      summary += `\n`
      
      // Communication insights
      if (communications.length > 0) {
        summary += `**Communication Activity:** ${communications.length} total communications\n`
        const channelCounts = communications.reduce((acc, c) => {
          acc[c.channel] = (acc[c.channel] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        summary += `• Channel breakdown: ${Object.entries(channelCounts)
          .map(([channel, count]) => `${channel.toUpperCase()}: ${count}`)
          .join(", ")}\n`
        
        if (recentCommunications.length > 0) {
          summary += `• Recent communications:\n`
          recentCommunications.forEach(comm => {
            summary += `  - ${comm.channel.toUpperCase()} (${comm.date}): ${comm.subject || "No subject"}\n`
          })
        }
        summary += `\n`
      } else {
        summary += `**Communication Activity:** No communications recorded yet\n\n`
      }
      
      // Interaction insights
      if (interactions.length > 0) {
        summary += `**Student Engagement:** ${interactions.length} recorded interactions\n`
        const interactionTypes = interactions.reduce((acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        summary += `• Activity types: ${Object.entries(interactionTypes)
          .map(([type, count]) => `${type.replaceAll("_", " ")}: ${count}`)
          .join(", ")}\n`
        
        if (recentInteractions.length > 0) {
          summary += `• Recent activity:\n`
          recentInteractions.forEach(interaction => {
            summary += `  - ${interaction.type} (${interaction.date}): ${interaction.detail || "No details"}\n`
          })
        }
        summary += `\n`
      } else {
        summary += `**Student Engagement:** No interactions recorded yet\n\n`
      }
      
      // Notes insights
      if (notes.length > 0) {
        summary += `**Internal Notes:** ${notes.length} notes on file\n`
        if (recentNotes.length > 0) {
          summary += `• Recent notes:\n`
          recentNotes.forEach(note => {
            summary += `  - ${note.date}: ${note.text}\n`
          })
        }
        summary += `\n`
      } else {
        summary += `**Internal Notes:** No notes recorded yet\n\n`
      }
      
      // Recommendations
      summary += `**AI Recommendations:**\n`
      
      if (student.highIntent) {
        summary += `• Priority follow-up recommended - this is a high-intent student\n`
      }
      
      if (student.needsEssayHelp) {
        summary += `• Consider offering essay writing support or resources\n`
      }
      
      if (lastContactedDate === "Never") {
        summary += `• Immediate outreach needed - student has never been contacted\n`
      } else {
        const daysSinceContact = lastContacted instanceof Date ? 
          Math.floor((Date.now() - lastContacted.getTime()) / (1000 * 60 * 60 * 24)) : 0
        if (daysSinceContact > 7) {
          summary += `• Follow-up overdue - last contact was ${daysSinceContact} days ago\n`
        } else if (daysSinceContact > 3) {
          summary += `• Consider follow-up soon - last contact was ${daysSinceContact} days ago\n`
        } else {
          summary += `• Recent contact - good engagement level\n`
        }
      }
      
      if (student.status === "Exploring") {
        summary += `• Focus on understanding student's goals and interests\n`
      } else if (student.status === "Shortlisting") {
        summary += `• Help with university selection and application strategy\n`
      } else if (student.status === "Applying") {
        summary += `• Provide application support and deadline management\n`
      } else if (student.status === "Submitted") {
        summary += `• Monitor application status and prepare for next steps\n`
      }
      
      if (communications.length === 0) {
        summary += `• Initiate first contact to establish relationship\n`
      }
      
      setAiSummary(summary)
    } catch (error) {
      console.error("Error generating AI summary:", error)
      setAiSummary("Error generating summary. Please try again.")
    } finally {
      setGeneratingSummary(false)
    }
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
          <CardTitle>Student Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="highIntent"
                checked={student.highIntent || false}
                onChange={async (e) => {
                  await updateDoc(doc(db, "students", id as string), {
                    highIntent: e.target.checked
                  })
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="highIntent" className="text-sm font-medium text-gray-700">
                High Intent Student
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needsEssayHelp"
                checked={student.needsEssayHelp || false}
                onChange={async (e) => {
                  await updateDoc(doc(db, "students", id as string), {
                    needsEssayHelp: e.target.checked
                  })
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="needsEssayHelp" className="text-sm font-medium text-gray-700">
                Needs Essay Help
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Summary</span>
            <Button 
              onClick={generateAISummary} 
              disabled={generatingSummary}
              variant="outline"
              size="sm"
            >
              {generatingSummary ? "Generating..." : aiSummary ? "Regenerate" : "Generate Summary"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {aiSummary}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🤖</div>
              <p>Click "Generate Summary" to create an AI-powered analysis of this student's profile</p>
            </div>
          )}
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
            <div className="max-h-80 overflow-y-auto border rounded-lg">
              <ul className="space-y-2 p-2">
                {communications.map((c) => (
                  <li key={c.id} className="border rounded p-3 bg-white hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium">
                      <span className="uppercase">{c.channel}</span>
                      {c.subject ? <span className="text-gray-600"> · {c.subject}</span> : ""}
                    </div>
                    {c.body ? (
                      <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {c.body}
                      </div>
                    ) : null}
                    <div className="text-xs text-gray-500 mt-2">
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : "—"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <Button onClick={sendMockFollowUpEmail}>Send Follow-up Email</Button>
            </div>
            
            {/* Personal Reminder */}
            <div className="border rounded p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Schedule Personal Reminder</h4>
              <p className="text-sm text-gray-600 mb-3">This reminder is only visible to you</p>
              <form onSubmit={scheduleReminder} className="flex flex-col md:flex-row gap-2">
                <Input name="reminderTitle" placeholder="Reminder title" />
                <Input name="reminderDue" type="date" required />
                <Button type="submit">Schedule Reminder</Button>
              </form>
            </div>

            {/* Shared Task */}
            <div className="border rounded p-4 bg-blue-50">
              <h4 className="font-medium mb-2">Schedule Shared Task</h4>
              <p className="text-sm text-gray-600 mb-3">This task will be visible to all team members in the Tasks tab</p>
              <form ref={taskFormRef} onSubmit={scheduleTask} className="flex flex-col md:flex-row gap-2">
                <Input name="taskTitle" placeholder="Task title" />
                <Input name="taskDue" type="date" required />
                <Button type="submit">Schedule Task</Button>
              </form>
            </div>
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
    </div>
  )
}