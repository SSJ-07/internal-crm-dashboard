"use client"

import { useState } from "react"
import { signInWithGoogle } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  // Google sign-in
  const handleGoogleLogin = async () => {
    try {
      setError(null)
      await signInWithGoogle()
      // The auth state listener will handle the redirect
      window.location.href = "/"
    } catch (err: any) {
      console.error('Google Sign-in Error:', err)
      setError(err.message || "Google Sign-in failed. Please try again.")
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Admin Login
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Internal CRM Dashboard - Authorized Access Only
        </p>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* Google login */}
        <Button onClick={handleGoogleLogin} className="w-full mb-6">
          Sign in with Google
        </Button>

        {/* Admin access notice */}
        <p className="text-center mt-4 text-sm text-gray-500">
          Need access? Contact your system administrator.
        </p>
      </div>
    </div>
  )
}