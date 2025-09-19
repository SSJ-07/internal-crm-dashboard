"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CommunicationItem {
  id: string
  channel?: "email" | "sms" | "call"
  communication_type?: "email" | "sms" | "call"
  subject?: string
  body?: string
  content?: string
  created_at: any
  createdAt?: any
  student_id?: string
  student_name?: string
  student_email?: string
  direction?: string
  status?: string
}

export default function CommunicationsPage() {
  const [allCommunications, setAllCommunications] = useState<CommunicationItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Communications filters
  const [commSearch, setCommSearch] = useState("")
  const [commTypeFilter, setCommTypeFilter] = useState<string>("__all")
  const [commDirectionFilter, setCommDirectionFilter] = useState<string>("__all")
  const [commStatusFilter, setCommStatusFilter] = useState<string>("__all")

  // Fetch all communications
  const fetchAllCommunications = async () => {
    try {
      setLoading(true)
      
      const response = await apiClient.getAllCommunications()
      if (response.success && response.data) {
        setAllCommunications(response.data)
      }
      
    } catch (error) {
      console.error("Error fetching all communications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllCommunications()
  }, [])

  // Filter communications based on search and filters
  const filteredCommunications = allCommunications.filter((comm) => {
    const searchText = `${comm.student_name || ""} ${comm.student_email || ""} ${comm.subject || ""} ${comm.content || ""}`.toLowerCase()
    const matchesSearch = commSearch === "" || searchText.includes(commSearch.toLowerCase())
    const matchesType = commTypeFilter === "__all" || comm.communication_type === commTypeFilter
    const matchesDirection = commDirectionFilter === "__all" || comm.direction === commDirectionFilter
    const matchesStatus = commStatusFilter === "__all" || comm.status === commStatusFilter
    
    return matchesSearch && matchesType && matchesDirection && matchesStatus
  })

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

  return (
    <div className="space-y-6">
      {/* Communications Header */}
      <Card>
        <CardHeader>
          <CardTitle>All Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Input
              placeholder="Search communications..."
              value={commSearch}
              onChange={(e) => setCommSearch(e.target.value)}
              className="w-64"
            />
            <Select value={commTypeFilter} onValueChange={setCommTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="call">Call</SelectItem>
              </SelectContent>
            </Select>
            <Select value={commDirectionFilter} onValueChange={setCommDirectionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={commStatusFilter} onValueChange={setCommStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={fetchAllCommunications}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {/* Summary stats */}
          <div className="flex flex-wrap gap-2 mb-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-white border">
              Total: {allCommunications.length}
            </span>
            <span className="px-3 py-1 rounded-full bg-white border">
              Email: {allCommunications.filter(c => c.communication_type === "email").length}
            </span>
            <span className="px-3 py-1 rounded-full bg-white border">
              SMS: {allCommunications.filter(c => c.communication_type === "sms").length}
            </span>
            <span className="px-3 py-1 rounded-full bg-white border">
              Call: {allCommunications.filter(c => c.communication_type === "call").length}
            </span>
            <span className="px-3 py-1 rounded-full bg-white border">
              Filtered: {filteredCommunications.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading communications...</div>
          ) : filteredCommunications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No communications found.
            </div>
          ) : (
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-2 p-4">
                {filteredCommunications.map((comm) => (
                  <div key={comm.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {comm.communication_type?.toUpperCase()}
                          </span>
                          {comm.direction && (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              comm.direction === "inbound" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {comm.direction.toUpperCase()}
                            </span>
                          )}
                          {comm.status && (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              comm.status === "sent" 
                                ? "bg-gray-100 text-gray-800"
                                : comm.status === "delivered"
                                ? "bg-blue-100 text-blue-800"
                                : comm.status === "read"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {comm.status.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          <a 
                            href={`/students/${comm.student_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {comm.student_name}
                          </a>
                          <span className="text-gray-500 ml-2">({comm.student_email})</span>
                        </div>
                        {comm.subject && (
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Subject: {comm.subject}
                          </div>
                        )}
                        {comm.content && (
                          <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {comm.content}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {formatTimestamp(comm.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
