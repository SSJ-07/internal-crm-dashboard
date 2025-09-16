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
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Task {
  id: string
  title: string
  due: string
  status: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

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

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.due}</TableCell>
                <TableCell>
                  <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}