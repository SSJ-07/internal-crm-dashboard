"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { auth } from "@/lib/firebase"
import { apiClient } from "@/lib/api-client"
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
  high_intent?: boolean
  needs_essay_help?: boolean
}

interface InteractionItem {
  id: string
  type: string
  detail?: string
  createdAt: any
}

interface CommunicationItem {
  id: string
  channel?: "email" | "sms" | "call"
  communication_type?: "email" | "sms" | "call"
  subject?: string
  body?: string
  content?: string
  created_at: any
  createdAt?: any
}

interface NoteItem {
  id: string
  text?: string
  content?: string
  title?: string
  created_at: any
  isEditing?: boolean
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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState("")

  useEffect(() => {
    if (!id) return
    
    const fetchStudent = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getStudent(id as string)
        if (response.success && response.data) {
          setStudent(response.data)
          // Mark last active on view
          await apiClient.updateStudentLastActive(id as string)
        } else {
          setStudent(null)
        }
      } catch (error) {
        console.error("Error fetching student:", error)
        setStudent(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
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
    
    const fetchInteractions = async () => {
      try {
        const response = await apiClient.getStudentInteractions(id as string)
        if (response.success && response.data) {
          setInteractions(response.data)
        }
      } catch (error) {
        console.error("Error fetching interactions:", error)
        setPermError("Failed to load interactions.")
      }
    }

    fetchInteractions()
  }, [id])

  const addInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    
    try {
      const response = await apiClient.createInteraction(id as string, {
        interaction_type: newType,
        description: newDetail,
        outcome: null,
        follow_up_required: false,
        follow_up_date: null
      })
      
      if (response.success) {
        // Refresh interactions
        const interactionsResponse = await apiClient.getStudentInteractions(id as string)
        if (interactionsResponse.success && interactionsResponse.data) {
          setInteractions(interactionsResponse.data)
        }
        setNewDetail("")
      }
    } catch (error) {
      console.error("Error adding interaction:", error)
      alert("Failed to add interaction")
    }
  }

  // Communications realtime
  useEffect(() => {
    if (!id) return
    
    const fetchCommunications = async () => {
      try {
        const response = await apiClient.getStudentCommunications(id as string)
        if (response.success && response.data) {
          setCommunications(response.data)
        }
      } catch (error) {
        console.error("Error fetching communications:", error)
        setPermError("Failed to load communications.")
      }
    }

    fetchCommunications()
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
        try {
          const result = await apiClient.sendEmail({
            to: "sumedh.sa.jadhav@gmail.com", // Test email address during testing
            subject: subjectTrimmed, 
            html: bodyTrimmed, 
            from_name: (auth.currentUser?.displayName || "CRM Team")
          })
          
          if (!result.success) {
            alert(`Failed to send email: ${result.error || "Unknown error"}`)
            return
          }
        } catch (error) {
          alert(`Failed to send email: ${error}`)
          return
        }
      }

      // Log the communication
      const response = await apiClient.createCommunication(id as string, {
        communication_type: commChannel,
        subject: subjectTrimmed || null,
        content: bodyTrimmed,
        direction: "outbound",
        status: "sent"
      })
      
      if (response.success) {
        // Refresh communications
        const communicationsResponse = await apiClient.getStudentCommunications(id as string)
        if (communicationsResponse.success && communicationsResponse.data) {
          setCommunications(communicationsResponse.data)
        }
      }
      
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
    if (!id || !student?.name) return
    const subject = "Follow-up: Next steps on your application"
    const html = `<p>Hi ${student.name || ''},</p><p>Just checking in to see if you need help with essays or documents.</p><p>Best regards,<br>Your CRM Team</p>`
    
    try {
      // Send to test email address during testing
      const result = await apiClient.sendEmail({
        to: "sumedh.sa.jadhav@gmail.com", // Test email address
        subject, 
        html, 
        from_name: (auth.currentUser?.displayName || "CRM Team")
      })
      
      if (!result.success) {
        alert(`Failed to send email: ${result.error || "Unknown error"}`)
        return
      }
      
      // Log the communication
      const response = await apiClient.createCommunication(id as string, {
        communication_type: "email",
        subject: subject,
        content: html,
        direction: "outbound",
        status: "sent"
      })
      
      if (response.success) {
        // Refresh communications
        const communicationsResponse = await apiClient.getStudentCommunications(id as string)
        if (communicationsResponse.success && communicationsResponse.data) {
          setCommunications(communicationsResponse.data)
        }
      }
      
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
      type: "reminder",
      createdBy: auth.currentUser?.email || "Unknown",
    }
    
    try {
      // Create reminder via API
      const response = await apiClient.createReminder({
        title,
        description: `Reminder for ${student?.name || "Unknown Student"}`,
        reminder_date: formattedDue,
        status: "pending"
      })
      
      if (response.success) {
        alert("Personal reminder scheduled successfully!")
        e.currentTarget.reset()
      } else {
        alert("Failed to schedule reminder. Please try again.")
      }
    } catch (error) {
      console.error("Error scheduling reminder:", error)
      alert("Error scheduling reminder. Please try again.")
    }
  }

  const scheduleTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id) return
    
    try {
      const formData = new FormData(e.currentTarget)
      const title = (formData.get("taskTitle") as string) || "Follow up"
      const due = formData.get("taskDue") as string
      
      const response = await apiClient.createTask({
        title,
        description: `Task for ${student?.name || "Unknown Student"}`,
        due_date: due,
        status: "Pending",
        priority: "Medium",
        student_id: id,
        student_name: student?.name || "Unknown Student"
      })
      
      if (response.success) {
        alert("Task scheduled and added to shared Tasks.")
        if (taskFormRef.current) {
          taskFormRef.current.reset()
        }
      } else {
        alert("Failed to create task. Please try again.")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      alert("Error creating task. Please try again.")
    }
  }

  // Notes realtime
  useEffect(() => {
    if (!id) return
    
    const fetchNotes = async () => {
      try {
        const response = await apiClient.getStudentNotes(id as string)
        if (response.success && response.data) {
          setNotes(response.data)
        }
      } catch (error) {
        console.error("Error fetching notes:", error)
        setPermError("Failed to load notes.")
      }
    }

    fetchNotes()
  }, [id])

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteText.trim()) return
    
    try {
      const response = await apiClient.createNote(id as string, {
        title: "Internal Note",
        content: noteText.trim(),
        is_private: true
      })
      
      if (response.success) {
        // Refresh notes
        const notesResponse = await apiClient.getStudentNotes(id as string)
        if (notesResponse.success && notesResponse.data) {
          setNotes(notesResponse.data)
        }
        setNoteText("")
      }
    } catch (error) {
      console.error("Error adding note:", error)
      alert("Failed to add note")
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!id) return
    
    try {
      const response = await apiClient.deleteStudentNote(id as string, noteId)
      if (response.success) {
        // Refresh notes
        const notesResponse = await apiClient.getStudentNotes(id as string)
        if (notesResponse.success && notesResponse.data) {
          setNotes(notesResponse.data)
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("Failed to delete note")
    }
  }

  const startEditingNote = (note: NoteItem) => {
    setEditingNoteId(note.id)
    setEditingNoteText(note.content || note.text || "")
  }

  const cancelEditingNote = () => {
    setEditingNoteId(null)
    setEditingNoteText("")
  }

  const saveEditedNote = async (noteId: string) => {
    if (!id || !editingNoteText.trim()) return
    
    try {
      const response = await apiClient.updateNote(id as string, noteId, {
        content: editingNoteText.trim()
      })
      
      if (response.success) {
        // Refresh notes
        const notesResponse = await apiClient.getStudentNotes(id as string)
        if (notesResponse.success && notesResponse.data) {
          setNotes(notesResponse.data)
        }
        setEditingNoteId(null)
        setEditingNoteText("")
      }
    } catch (error) {
      console.error("Error updating note:", error)
      alert("Failed to update note")
    }
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "—"
    
    // Handle both Firestore timestamp objects and ISO strings
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString()
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString()
    }
    
    return "—"
  }

  const generateAISummary = async () => {
    if (!student) return
    
    setGeneratingSummary(true)
    
    try {
      // Collect all relevant data for the summary
      const lastContacted = student.lastContactedAt?.toDate?.() || student.lastContactedAt
      const lastContactedDate = lastContacted instanceof Date ? lastContacted.toLocaleDateString() : "Never"
      
      const recentCommunications = communications.slice(0, 3).map(c => ({
        channel: c.communication_type || c.channel,
        subject: c.subject,
        body: (c.content || c.body)?.substring(0, 100) + ((c.content || c.body) && (c.content || c.body).length > 100 ? "..." : ""),
        date: c.created_at?.toDate?.()?.toLocaleDateString() || formatTimestamp(c.created_at || c.createdAt)
      }))
      
      const recentInteractions = interactions.slice(0, 3).map(i => ({
        type: i.type.replaceAll("_", " "),
        detail: i.detail,
        date: i.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"
      }))
      
      const recentNotes = notes.slice(0, 3).map(n => ({
        text: (n.content || n.text || "").substring(0, 100) + ((n.content || n.text || "").length > 100 ? "..." : ""),
        content: n.content || n.text || "",
        date: n.created_at?.toDate?.()?.toLocaleDateString() || formatTimestamp(n.created_at)
      }))
      
      // Generate AI summary based on available data
      let summary = `**Student Profile Summary for ${student.name}**\n\n`
      
      // Basic info
      summary += `**Current Status:** ${student.status}\n`
      summary += `**Country:** ${student.country}\n`
      summary += `**Last Contacted:** ${lastContactedDate}\n`
      summary += `**Grade:** ${student.grade || "Not specified"}\n\n`
      
      // Classification flags
      if (student.highIntent || student.high_intent || student.needsEssayHelp || student.needs_essay_help) {
        summary += `**Key Classifications:**\n`
        if (student.highIntent || student.high_intent) summary += `• High Intent Student - Priority candidate\n`
        if (student.needsEssayHelp || student.needs_essay_help) summary += `• Needs Essay Help - Requires additional support\n`
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
            summary += `  - ${note.date}: ${note.content || note.text || "No content"}\n`
          })
        }
        summary += `\n`
      } else {
        summary += `**Internal Notes:** No notes recorded yet\n\n`
      }
      
      // Recommendations
      summary += `**AI Recommendations:**\n`
      
      if (student.highIntent || student.high_intent) {
        summary += `• Priority follow-up recommended - this is a high-intent student\n`
      }
      
      if (student.needsEssayHelp || student.needs_essay_help) {
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
                checked={student.highIntent || student.high_intent || false}
                onChange={async (e) => {
                  try {
                    const response = await apiClient.updateStudentCheckboxes(id as string, {
                      highIntent: e.target.checked
                    })
                    if (response.success && response.data) {
                      setStudent(response.data)
                    }
                  } catch (error) {
                    console.error("Error updating high intent:", error)
                    alert("Failed to update high intent status")
                  }
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
                checked={student.needsEssayHelp || student.needs_essay_help || false}
                onChange={async (e) => {
                  try {
                    const response = await apiClient.updateStudentCheckboxes(id as string, {
                      needsEssayHelp: e.target.checked
                    })
                    if (response.success && response.data) {
                      setStudent(response.data)
                    }
                  } catch (error) {
                    console.error("Error updating essay help:", error)
                    alert("Failed to update essay help status")
                  }
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
                      <span className="uppercase">{c.communication_type || c.channel}</span>
                      {c.subject ? <span className="text-gray-600"> · {c.subject}</span> : ""}
                    </div>
                    {(c.content || c.body) ? (
                      <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {c.content || c.body}
                      </div>
                    ) : null}
                    <div className="text-xs text-gray-500 mt-2">
                      {formatTimestamp(c.created_at || c.createdAt)}
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
                  <div className="flex-1">
                    {editingNoteId === n.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                          rows={3}
                          placeholder="Edit note..."
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => saveEditedNote(n.id)}
                            disabled={!editingNoteText.trim()}
                          >
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={cancelEditingNote}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm whitespace-pre-wrap">{n.content || n.text || "No content"}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatTimestamp(n.created_at)}</div>
                      </>
                    )}
                  </div>
                  {editingNoteId !== n.id && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => startEditingNote(n)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteNote(n.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}