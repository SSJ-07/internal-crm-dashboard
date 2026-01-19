// Temporary auth shim: disable Firebase Auth and treat all users as a fixed admin user.
// import {
//   signInWithPopup,
//   GoogleAuthProvider,
//   onAuthStateChanged,
//   signOut as firebaseSignOut,
//   User as FirebaseUser
// } from 'firebase/auth'
// import { auth as firebaseAuth } from './firebase'

export interface User {
  id: string
  email: string
  name: string
}

class AuthService {
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []
  // private authStateUnsubscribe: (() => void) | null = null

  constructor() {
    // Instead of real Firebase Auth, immediately set a default admin user.
    if (typeof window !== 'undefined') {
      this.currentUser = {
        id: 'demo-admin',
        email: 'crm@example.com',
        name: 'CRM Admin',
      }
      this.notifyListeners()
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser))
  }

  async signInWithGoogle() {
    // No-op while Firebase Auth is disabled
    return { user: this.currentUser }
  }

  async logout() {
    // No-op while Firebase Auth is disabled
  }

  onAuthChange(callback: (user: User | null) => void) {
    // Immediately inform the subscriber of the current auth state
    callback(this.currentUser)

    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  getCurrentUserSync() {
    return this.currentUser
  }

  // Cleanup method
  destroy() {
    // No-op while Firebase Auth is disabled
  }
}

// Create singleton instance
const authService = new AuthService()

// Export functions that match the original Firebase Auth API
export function signInWithGoogle() {
  return authService.signInWithGoogle()
}

export function loginWithEmail(email: string, password: string) {
  // For Firebase Auth, we'll use Google Sign-in for now
  // Email/password authentication would require Firebase Auth setup
  throw new Error("Email/password authentication not implemented. Please use Google Sign-in.")
}

export function registerWithEmail(email: string, password: string) {
  // For Firebase Auth, we'll use Google Sign-in for now
  // Email/password authentication would require Firebase Auth setup
  throw new Error("Email/password registration not implemented. Please use Google Sign-in.")
}

export function logout() {
  return authService.logout()
}

export function onAuthChange(callback: (user: User | null) => void) {
  return authService.onAuthChange(callback)
}

// Export the current user getter
export const auth = {
  currentUser: authService.getCurrentUserSync()
}