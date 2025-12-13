"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get("token")

    if (token) {
      // Store token in localStorage
      localStorage.setItem("token", token)
      
      // Fetch user data and store it
      fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch user data')
          }
          return res.json()
        })
        .then(data => {
          // Backend returns user data at root level, not nested
          const { organizations, ...userData } = data
          // Store user data for offline access
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('organizations', JSON.stringify(organizations || []))
          
          // Small delay to ensure localStorage is written
          setTimeout(() => {
            router.push("/")
          }, 100)
        })
        .catch(err => {
          console.error('Error fetching user data:', err)
          // Clear invalid token
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('organizations')
          // Redirect to login
          router.push("/login")
        })
    } else {
      // If no token, redirect to login
      router.push("/login")
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
