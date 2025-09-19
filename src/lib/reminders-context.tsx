"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from './api-client'

export interface Reminder {
  id: string
  title: string
  description?: string
  reminder_date: string
  status: 'pending' | 'completed' | 'cancelled'
  studentName?: string
  createdAt: Date
  isPersonal?: boolean
}

interface RemindersContextType {
  reminders: Reminder[]
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void
  updateReminder: (id: string, updates: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  getUpcomingReminders: () => Reminder[]
  getOverdueReminders: () => Reminder[]
  loading: boolean
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined)

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  // Load reminders from backend API
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getReminders()
        if (response.success && response.data) {
          // Convert backend data to frontend format
          const formattedReminders = response.data.map((reminder: any) => ({
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            reminder_date: reminder.reminder_date,
            status: reminder.status,
            studentName: reminder.studentName || 'General',
            createdAt: new Date(reminder.created_at),
            isPersonal: true
          }))
          setReminders(formattedReminders)
             } else {
               console.error('Failed to fetch reminders:', response.error)
               // No fallback - just empty array
               setReminders([])
             }
           } catch (error) {
             console.error('Error fetching reminders:', error)
             // No fallback - just empty array
             setReminders([])
           } finally {
             setLoading(false)
           }
    }

    fetchReminders()
  }, [])


  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
    try {
      const response = await apiClient.createReminder({
        title: reminderData.title,
        description: reminderData.description || '',
        reminder_date: reminderData.reminder_date,
        status: reminderData.status
      })
      
      if (response.success && response.data) {
        const newReminder: Reminder = {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
          reminder_date: response.data.reminder_date,
          status: response.data.status,
          studentName: reminderData.studentName || 'General',
          createdAt: new Date(response.data.created_at),
          isPersonal: true
        }
        setReminders(prev => [...prev, newReminder])
      } else {
        console.error('Failed to create reminder:', response.error)
        // Fallback to local state if API fails
        const newReminder: Reminder = {
          ...reminderData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date()
        }
        setReminders(prev => [...prev, newReminder])
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      // Fallback to local state if API fails
      const newReminder: Reminder = {
        ...reminderData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date()
      }
      setReminders(prev => [...prev, newReminder])
    }
  }

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      // For now, just update local state since we don't have an update endpoint
      // In a real app, you'd call an API endpoint to update the reminder
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === id ? { ...reminder, ...updates } : reminder
        )
      )
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  const deleteReminder = async (id: string) => {
    try {
      // For now, just update local state since we don't have a delete endpoint
      // In a real app, you'd call an API endpoint to delete the reminder
      setReminders(prev => prev.filter(reminder => reminder.id !== id))
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  const getUpcomingReminders = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return reminders.filter(reminder => {
      if (!reminder.reminder_date || reminder.status === 'completed') return false
      return reminder.reminder_date >= today && reminder.reminder_date <= nextWeek
    })
  }

  const getOverdueReminders = () => {
    const today = new Date().toISOString().split('T')[0]
    return reminders.filter(reminder => {
      if (!reminder.reminder_date || reminder.status === 'completed') return false
      return reminder.reminder_date < today
    })
  }

  return (
    <RemindersContext.Provider value={{
      reminders,
      addReminder,
      updateReminder,
      deleteReminder,
      getUpcomingReminders,
      getOverdueReminders,
      loading
    }}>
      {children}
    </RemindersContext.Provider>
  )
}

export function useReminders() {
  const context = useContext(RemindersContext)
  if (context === undefined) {
    throw new Error('useReminders must be used within a RemindersProvider')
  }
  return context
}
