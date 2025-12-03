"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get("token")
    const role = searchParams.get("role")

    if (token && role) {
      // Store token in localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("userRole", role)
      
      // Redirect to home page
      router.push("/")
    } else {
      // If no token, redirect to login
      router.push("/")
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
