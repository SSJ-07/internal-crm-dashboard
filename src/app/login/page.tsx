"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"login" | "signup">("login") // toggle between login & signup

  // Google sign-in
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      window.location.href = "/"
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      window.location.href = "/"
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Email signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      window.location.href = "/"
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Login" : "Sign Up"}
        </h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* Google login */}
        <Button onClick={handleGoogleLogin} className="w-full mb-6">
          Sign in with Google
        </Button>

        {/* Email login or signup */}
        {mode === "login" ? (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Sign in with Email
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="New email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full bg-green-600">
              Create Account
            </Button>
          </form>
        )}

        {/* Toggle link */}
        <p className="text-center mt-4 text-sm">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-blue-600 underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-blue-600 underline"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}