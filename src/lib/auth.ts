import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { auth as firebaseAuth } from './firebase'

export interface User {
  id: string
  email: string
  name: string
}

class AuthService {
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []
  private authStateUnsubscribe: (() => void) | null = null

  constructor() {
    // Set up Firebase Auth state listener
    this.setupAuthStateListener()
  }

  private setupAuthStateListener() {
    // Only set up listener on client side
    if (typeof window === 'undefined') return
    
    this.authStateUnsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        try {
          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken()
          
          // Store token for backend API calls
          if (typeof window !== 'undefined') {
            localStorage.setItem('firebase_id_token', idToken)
          }
          
          // Set user data
          this.currentUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email || 'User'
          }
          this.notifyListeners()
          
          console.log('✅ Firebase Auth successful:', this.currentUser.email)
        } catch (error) {
          console.error('❌ Error getting Firebase ID token:', error)
          this.currentUser = null
          this.notifyListeners()
        }
      } else {
        // User is signed out
        if (typeof window !== 'undefined') {
          localStorage.removeItem('firebase_id_token')
        }
        this.currentUser = null
        this.notifyListeners()
      }
    })
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser))
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(firebaseAuth, provider)
      return { user: result.user }
    } catch (error) {
      throw error
    }
  }

  async logout() {
    try {
      await firebaseSignOut(firebaseAuth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  onAuthChange(callback: (user: User | null) => void) {
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
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe()
    }
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