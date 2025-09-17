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
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Task {
  id: string
  title: string
  due: string
  status: string
  studentId?: string
  studentName?: string
  deletedAt?: any
  deletedBy?: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Filter state
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("__all")
  const [studentFilter, setStudentFilter] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "in-progress" | "finished" | "deleted">("all")
  
  // Sorting state
  const [sortField, setSortField] = useState<"title" | "studentName" | "due" | "status">("due")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // ✅ Real-time listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[]
      setTasks(tasksData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAddTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const newTask = {
      title: formData.get("title") as string,
      due: formData.get("due") as string,
      status: "Pending",
    }

    await addDoc(collection(db, "tasks"), newTask)

    formRef.current.reset()
    setOpen(false)
  }

  const handleStatusChange = async (taskId: string, nextStatus: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: nextStatus })
    } catch (error) {
      console.error("Failed updating status", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task? It will be moved to the Deleted Tasks tab.")) {
      try {
        // Instead of deleting, mark as deleted
        await updateDoc(doc(db, "tasks", taskId), {
          deletedAt: serverTimestamp(),
          deletedBy: auth.currentUser?.email || "Unknown",
          status: "Deleted"
        })
      } catch (error) {
        console.error("Failed deleting task", error)
        alert("Failed to delete task")
      }
    }
  }

  const handleRestoreTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        deletedAt: null,
        deletedBy: null,
        status: "Pending"
      })
    } catch (error) {
      console.error("Failed restoring task", error)
      alert("Failed to restore task")
    }
  }

  const handlePermanentDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to permanently delete this task? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "tasks", taskId))
      } catch (error) {
        console.error("Failed permanently deleting task", error)
        alert("Failed to permanently delete task")
      }
    }
  }

  const handleSort = (field: "title" | "studentName" | "due" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "studentName":
          aValue = (a.studentName || "").toLowerCase()
          bValue = (b.studentName || "").toLowerCase()
          break
        case "due":
          aValue = new Date(a.due)
          bValue = new Date(b.due)
          break
        case "status":
          aValue = a.status.toLowerCase()
          bValue = b.status.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }

  const handleReopenTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: "Pending" })
    } catch (error) {
      console.error("Failed reopening task", error)
      alert("Failed to reopen task")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <form ref={formRef} className="flex flex-col gap-4 mt-4" onSubmit={handleAddTask}>
              <Input name="title" placeholder="Task title" required />
              <Input name="due" type="date" required />
              <Button type="submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => setActiveTab("all")}
        >
          All Tasks
        </Button>
        <Button 
          variant={activeTab === "pending" ? "default" : "outline"}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </Button>
        <Button 
          variant={activeTab === "in-progress" ? "default" : "outline"}
          onClick={() => setActiveTab("in-progress")}
        >
          In Progress
        </Button>
        <Button 
          variant={activeTab === "finished" ? "default" : "outline"}
          onClick={() => setActiveTab("finished")}
        >
          Finished
        </Button>
        <Button 
          variant={activeTab === "deleted" ? "default" : "outline"}
          onClick={() => setActiveTab("deleted")}
          className="text-gray-600 hover:text-gray-800"
        >
          🗑️
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          placeholder="Search tasks or students"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        {activeTab === "all" && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Finished</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Input
          placeholder="Filter by student"
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          <span className="px-3 py-1 rounded-full bg-white border">Total: {tasks.filter(t => t.status !== "Deleted").length}</span>
          <span className="px-3 py-1 rounded-full bg-white border">Pending: {tasks.filter(t => t.status === "Pending").length}</span>
          <span className="px-3 py-1 rounded-full bg-white border">In Progress: {tasks.filter(t => t.status === "In Progress").length}</span>
          <span className="px-3 py-1 rounded-full bg-white border">Finished: {tasks.filter(t => t.status === "Done").length}</span>
        </div>
      )}

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1">
                  Task
                  {sortField === "title" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("studentName")}
              >
                <div className="flex items-center gap-1">
                  Student
                  {sortField === "studentName" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("due")}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  {sortField === "due" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === "status" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortTasks(tasks
              .filter((task) => {
                const text = `${task.title} ${task.studentName || ""}`.toLowerCase()
                const matchesSearch = text.includes(search.toLowerCase())
                const matchesTab = 
                  (activeTab === "all" && task.status !== "Deleted") ||
                  (activeTab === "pending" && task.status === "Pending") ||
                  (activeTab === "in-progress" && task.status === "In Progress") ||
                  (activeTab === "finished" && task.status === "Done") ||
                  (activeTab === "deleted" && task.status === "Deleted")
                const matchesStatus = activeTab === "all" ? (statusFilter === "__all" ? true : task.status === statusFilter) : true
                const matchesStudent = studentFilter
                  ? (task.studentName || "").toLowerCase().includes(studentFilter.toLowerCase())
                  : true
                return matchesSearch && matchesTab && matchesStatus && matchesStudent
              }))
              .map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  {task.studentName ? (
                    <a href={`/students/${task.studentId}`} className="text-blue-600 hover:underline">
                      {task.studentName}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{task.due}</TableCell>
                <TableCell>
                  {activeTab === "finished" ? (
                    <span className="text-green-600 font-medium">Finished</span>
                  ) : activeTab === "deleted" ? (
                    <span className="text-red-600 font-medium">Deleted</span>
                  ) : activeTab === "all" ? (
                    <span className={`font-medium ${
                      task.status === "Pending" ? "text-yellow-600" :
                      task.status === "In Progress" ? "text-blue-600" :
                      task.status === "Done" ? "text-green-600" : "text-gray-600"
                    }`}>
                      {task.status === "Done" ? "Finished" : task.status}
                    </span>
                  ) : (
                    <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Finished</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {activeTab === "finished" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReopenTask(task.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Reopen
                      </Button>
                    )}
                    {activeTab === "deleted" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRestoreTask(task.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Restore
                      </Button>
                    )}
                    {activeTab === "deleted" ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePermanentDelete(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete Forever
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}