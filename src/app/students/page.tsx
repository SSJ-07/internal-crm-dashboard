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
import { apiClient } from "@/lib/api-client"

interface Student {
  id: string
  name: string
  email: string
  country: string
  status: string
  last_active: string
  last_contacted_at?: string
  high_intent?: boolean
  needs_essay_help?: boolean
  phone?: string
  grade?: string
  source?: string
  additional_data?: any
  created_at: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Bulk import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)

  // UI state: filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("__all")
  const [countryFilter, setCountryFilter] = useState<string>("")
  const [notContacted7d, setNotContacted7d] = useState(false)
  const [highIntent, setHighIntent] = useState(false)
  const [needsEssayHelp, setNeedsEssayHelp] = useState(false)

  // Fetch students from FastAPI backend
  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getStudents()
      if (response.success && response.data) {
        setStudents(response.data)
      } else {
        console.error("Failed to fetch students:", response.error)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Refresh students data when page becomes visible (e.g., when navigating back from student profile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStudents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Helper functions to classify students
  const isNotContactedIn7Days = (student: Student) => {
    if (!student.last_contacted_at) return true // Never contacted
    const lastContacted = new Date(student.last_contacted_at)
    const lastContactedMs = lastContacted.getTime()
    return Date.now() - lastContactedMs > 7 * 24 * 60 * 60 * 1000
  }

  const isHighIntent = (student: Student) => {
    return Boolean(student.high_intent)
  }

  const isNeedsEssayHelp = (student: Student) => {
    return Boolean(student.needs_essay_help)
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
      status: formData.get("status") as string,
      high_intent: false,
      needs_essay_help: false,
    }

    try {
      const response = await apiClient.createStudent(newStudent)
      if (response.success) {
        // Refresh the students list
        const studentsResponse = await apiClient.getStudents()
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data)
        }
        formRef.current.reset()
        setOpen(false)
      } else {
        console.error("Failed to create student:", response.error)
      }
    } catch (error) {
      console.error("Error creating student:", error)
    }
  }

  // Bulk import functionality
  const handleBulkImport = async () => {
    if (!importFile) return
    
    setIsImporting(true)
    setImportResult(null)
    
    try {
      const text = await importFile.text()
      console.log('File content:', text)
      
      const students = JSON.parse(text)
      console.log('Parsed students:', students)
      
      const response = await apiClient.bulkImportStudents(students, false)
      
      if (response.success && response.data) {
        console.log('Import result:', response.data)
        setImportResult(response.data)
        
        // Refresh the students list if import was successful
        if (response.data.success) {
          const studentsResponse = await apiClient.getStudents()
          if (studentsResponse.success && studentsResponse.data) {
            setStudents(studentsResponse.data)
          }
        }
      } else {
        console.error('Import error:', response.error)
        setImportResult({ 
          success: false, 
          error: response.error || "Unknown error occurred" 
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({ 
        success: false, 
        error: `Failed to import students: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Export functionality
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await apiClient.exportStudents(format)
      
      if (response.success && response.data) {
        // Create blob from the file data
        const blob = new Blob([response.data.file_data], { 
          type: response.data.content_type 
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.data.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Export error:', response.error)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            Export JSON
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Students</DialogTitle>
            </DialogHeader>
            
            {/* Toggle between single and bulk import */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={!showBulkImport ? "default" : "outline"}
                onClick={() => setShowBulkImport(false)}
                size="sm"
              >
                Add Single Student
              </Button>
              <Button
                variant={showBulkImport ? "default" : "outline"}
                onClick={() => setShowBulkImport(true)}
                size="sm"
              >
                Bulk Import
              </Button>
            </div>

            {!showBulkImport ? (
              // Single student form
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

                <Button type="submit">Save Student</Button>
              </form>
            ) : (
              // Bulk import form
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload JSON File
                  </label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">
                    Upload a JSON file with student data. Download sample format below.
                  </p>
                </div>

                {/* Sample format download */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sampleData = [
                        {
                          name: "John Doe",
                          email: "john@example.com",
                          phone: "+1234567890",
                          grade: "12th",
                          country: "United States",
                          status: "Exploring",
                          highIntent: false,
                          needsEssayHelp: false
                        },
                        {
                          name: "Jane Smith",
                          email: "jane@example.com",
                          phone: "+1234567891",
                          grade: "11th",
                          country: "Canada",
                          status: "Shortlisting",
                          highIntent: true,
                          needsEssayHelp: true
                        }
                      ]
                      
                      const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'sample-students.json'
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }}
                  >
                    Download Sample Format
                  </Button>
                </div>

                {/* Import and Clear buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBulkImport} 
                    disabled={!importFile || isImporting}
                    className="flex-1"
                  >
                    {isImporting ? "Importing..." : "Import Students"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setImportFile(null)
                      setImportResult(null)
                    }}
                    disabled={isImporting}
                  >
                    Clear
                  </Button>
                </div>

                {/* Import results */}
                {importResult && (
                  <div className={`p-4 rounded ${
                    importResult.success ? 'bg-green-50 border border-green-200' : 
                    (importResult.summary || importResult.errors) ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    {importResult.success ? (
                      <div>
                        <div className="font-medium text-green-800 mb-3">
                          ✅ Import Completed!
                        </div>
                        
                        {/* Summary Stats */}
                        {importResult.summary && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-green-600">{importResult.summary.imported}</div>
                              <div className="text-xs text-gray-600">Imported</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-orange-600">{importResult.summary.skipped}</div>
                              <div className="text-xs text-gray-600">Skipped (Duplicates)</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-red-600">{importResult.summary.validationErrors}</div>
                              <div className="text-xs text-gray-600">Validation Errors</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-gray-600">{importResult.summary.total}</div>
                              <div className="text-xs text-gray-600">Total</div>
                            </div>
                          </div>
                        )}

                        {/* Detailed Results */}
                        <div className="text-sm text-gray-700 space-y-1">
                          <div>✅ Successfully imported: <strong>{importResult.imported}</strong> students</div>
                          {importResult.summary?.skipped > 0 && (
                            <div>⚠️ Skipped: <strong>{importResult.summary.skipped}</strong> students (duplicate emails)</div>
                          )}
                          {importResult.summary?.validationErrors > 0 && (
                            <div>❌ Validation errors: <strong>{importResult.summary.validationErrors}</strong> students</div>
                          )}
                        </div>

                        {/* Show first few errors if any */}
                        {importResult.errors?.length > 0 && (
                          <div className="mt-3">
                            <div className="font-medium text-gray-700 mb-2">Issues Found:</div>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                              {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                                <div key={index} className="text-sm bg-red-50 border border-red-200 p-3 rounded">
                                  <div className="font-medium text-red-800">
                                    Student {error.row} ({error.email}): {error.error}
                                  </div>
                                </div>
                              ))}
                              {importResult.errors.length > 5 && (
                                <div className="text-gray-500 italic text-sm p-2 bg-gray-50 rounded">
                                  ... and {importResult.errors.length - 5} more issues
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (importResult.summary || importResult.errors) ? (
                      <div>
                        <div className="font-medium text-yellow-800 mb-3">
                          ⚠️ Import Processed with Issues
                        </div>
                        
                        {/* Summary Stats */}
                        {importResult.summary && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-green-600">{importResult.summary.imported}</div>
                              <div className="text-xs text-gray-600">Imported</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-orange-600">{importResult.summary.skipped}</div>
                              <div className="text-xs text-gray-600">Skipped (Duplicates)</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-red-600">{importResult.summary.validationErrors}</div>
                              <div className="text-xs text-gray-600">Validation Errors</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                              <div className="text-lg font-bold text-gray-600">{importResult.summary.total}</div>
                              <div className="text-xs text-gray-600">Total</div>
                            </div>
                          </div>
                        )}

                        {/* Detailed Results */}
                        <div className="text-sm text-gray-700 space-y-1">
                          <div>✅ Successfully imported: <strong>{importResult.imported}</strong> students</div>
                          {importResult.summary?.skipped > 0 && (
                            <div>⚠️ Skipped: <strong>{importResult.summary.skipped}</strong> students (duplicate emails)</div>
                          )}
                          {importResult.summary?.validationErrors > 0 && (
                            <div>❌ Validation errors: <strong>{importResult.summary.validationErrors}</strong> students</div>
                          )}
                        </div>

                        {/* Show first few errors if any */}
                        {importResult.errors?.length > 0 && (
                          <div className="mt-3">
                            <div className="font-medium text-gray-700 mb-2">Issues Found:</div>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                              {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                                <div key={index} className="text-sm bg-red-50 border border-red-200 p-3 rounded">
                                  <div className="font-medium text-red-800">
                                    Student {error.row} ({error.email}): {error.error}
                                  </div>
                                </div>
                              ))}
                              {importResult.errors.length > 5 && (
                                <div className="text-gray-500 italic text-sm p-2 bg-gray-50 rounded">
                                  ... and {importResult.errors.length - 5} more issues
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-800">
                        <div className="font-medium">❌ Import Failed</div>
                        <div className="text-sm">{importResult.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
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
        <Button 
          variant={notContacted7d ? "default" : "outline"} 
          onClick={() => setNotContacted7d(!notContacted7d)}
        >
          Not contacted in 7 days
        </Button>
        <Button 
          variant={highIntent ? "default" : "outline"} 
          onClick={() => {
            console.log("High intent clicked, current state:", highIntent)
            setHighIntent(!highIntent)
          }}
        >
          High intent
        </Button>
        <Button 
          variant={needsEssayHelp ? "default" : "outline"} 
          onClick={() => {
            console.log("Needs essay help clicked, current state:", needsEssayHelp)
            setNeedsEssayHelp(!needsEssayHelp)
          }}
        >
          Needs essay help
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            console.log("Refreshing students data...")
            fetchStudents()
          }}
        >
          Refresh
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
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
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
                      const isHigh = isHighIntent(s)
                      console.log(`High intent filter: ${s.name}, high_intent=${s.high_intent}, isHigh=${isHigh}`)
                      matchesQuick = matchesQuick && isHigh
                    }
                    
                    if (needsEssayHelp) {
                      const isEssay = isNeedsEssayHelp(s)
                      console.log(`Essay help filter: ${s.name}, needs_essay_help=${s.needs_essay_help}, isEssay=${isEssay}`)
                      matchesQuick = matchesQuick && isEssay
                    }
                    
                    const finalMatch = matchesSearch && matchesStatus && matchesCountry && matchesQuick
                    if (highIntent || needsEssayHelp) {
                      console.log(`Final result for ${s.name}:`, {
                        matchesSearch,
                        matchesStatus,
                        matchesCountry,
                        matchesQuick,
                        finalMatch,
                        highIntent,
                        needsEssayHelp
                      })
                    }
                    
                    return finalMatch
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
                      // Format last active date
                      s.last_active
                        ? new Date(s.last_active).toISOString().split("T")[0]
                        : "—"
                    }</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}