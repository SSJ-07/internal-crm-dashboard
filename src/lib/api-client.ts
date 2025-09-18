/**
 * API Client for communicating with FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Get token from localStorage or Firebase Auth
    this.token = this.getAuthToken()
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || `HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Authentication methods
  async login(): Promise<ApiResponse<{ access_token: string; token_type: string }>> {
    const response = await this.request<{ access_token: string; token_type: string }>('/api/auth/login', {
      method: 'POST',
    })
    
    if (response.success && response.data) {
      this.token = response.data.access_token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.access_token)
      }
    }
    
    return response
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    })
    
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    
    return response
  }

  // Student methods
  async getStudents(params: {
    skip?: number
    limit?: number
    status?: string
    country?: string
    high_intent?: boolean
    needs_essay_help?: boolean
  } = {}): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
    
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/api/students/?${queryString}` : '/api/students/'
    
    const response = await this.request<any>(endpoint, {
      method: 'GET',
    })
    
    // Handle the response format from our simple backend
    if (response.success && response.data && response.data.students) {
      return {
        success: true,
        data: response.data.students
      }
    }
    
    return response
  }

  async getStudent(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/students/${id}`, {
      method: 'GET',
    })
  }

  async createStudent(studentData: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/students/', {
      method: 'POST',
      body: JSON.stringify(studentData),
    })
  }

  async updateStudent(id: string, studentData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    })
  }

  async deleteStudent(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/students/${id}`, {
      method: 'DELETE',
    })
  }

  async searchStudents(searchData: {
    query: string
    limit?: number
    offset?: number
    status_filter?: string
    country_filter?: string
    high_intent_only?: boolean
    needs_essay_help_only?: boolean
    not_contacted_7_days?: boolean
  }): Promise<ApiResponse<{
    students: any[]
    total: number
    page: number
    limit: number
    has_more: boolean
  }>> {
    return this.request('/api/students/search', {
      method: 'POST',
      body: JSON.stringify(searchData),
    })
  }

  async bulkImportStudents(students: any[], validateOnly: boolean = false): Promise<ApiResponse<any>> {
    return this.request('/api/students/bulk/import', {
      method: 'POST',
      body: JSON.stringify({
        students,
        validate_only: validateOnly,
      }),
    })
  }

  async exportStudents(format: 'csv' | 'json'): Promise<ApiResponse<{
    file_data: string
    content_type: string
    filename: string
  }>> {
    return this.request('/api/students/bulk/export', {
      method: 'POST',
      body: JSON.stringify({ format }),
    })
  }

  async getStudentAnalytics(analyticsData: {
    date_range_days?: number
    include_demographics?: boolean
    include_engagement?: boolean
  } = {}): Promise<ApiResponse<any>> {
    return this.request('/api/students/analytics', {
      method: 'POST',
      body: JSON.stringify(analyticsData),
    })
  }

  async validateStudentData(studentData: any): Promise<ApiResponse<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>> {
    return this.request('/api/students/validate', {
      method: 'POST',
      body: JSON.stringify(studentData),
    })
  }

  // Email methods
  async sendEmail(emailData: {
    to: string
    subject: string
    html: string
    from_name?: string
  }): Promise<ApiResponse<{
    success: boolean
    message_id?: string
    error?: string
  }>> {
    return this.request('/api/email/send', {
      method: 'POST',
      body: JSON.stringify(emailData),
    })
  }

  async testEmail(): Promise<ApiResponse<any>> {
    return this.request('/api/email/test', {
      method: 'POST',
    })
  }

  // Reminders
  async getReminders(): Promise<ApiResponse<any[]>> {
    return this.request('/api/reminders', {
      method: 'GET',
    })
  }

  async createReminder(reminderData: any): Promise<ApiResponse<any>> {
    return this.request('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    })
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/api/dashboard/stats', {
      method: 'GET',
    })
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
