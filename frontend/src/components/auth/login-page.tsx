"use client"

import { useState } from "react"
import { Cloud, Mail } from "lucide-react"

interface LoginPageProps {
  onLogin: (role: "student" | "teacher") => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null)
  
  const handleGoogleLogin = async () => {
    if (!selectedRole) return
    
    try {
      // Get OAuth URL from backend
      const response = await fetch(`http://localhost:3001/api/auth/google?role=${selectedRole}`)
      const data = await response.json()
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl
    } catch (error) {
      console.error('Failed to initiate Google login:', error)
      alert('Failed to connect to authentication server. Please try again.')
    }
  }

  const roles = [
    {
      id: "student",
      name: "Student",
      description: "View assignments, grades, and attendance",
      icon: "👨‍🎓",
    },
    {
      id: "teacher",
      name: "Educator",
      description: "Create assignments, manage classes, track performance",
      icon: "👨‍🏫",
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
              <Cloud className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">SkyFlow</h1>
            <p className="text-lg text-muted-foreground">Unified Academic Collaboration Platform</p>
          </div>

          {/* Role Selection */}
          {!selectedRole ? (
            <div className="space-y-4">
              <p className="text-center text-foreground font-semibold mb-6">Select your role to continue</p>
              <div className="grid md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id as any)}
                    className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-card transition-all duration-200 group"
                  >
                    <div className="text-4xl mb-3">{role.icon}</div>
                    <h3 className="font-semibold text-foreground mb-2">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-8 border border-border">
                <div className="mb-6">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    ← Back to role selection
                  </button>
                  <h2 className="text-2xl font-bold text-foreground">
                    Sign in as {roles.find((r) => r.id === selectedRole)?.name}
                  </h2>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Mail className="w-5 h-5" />
                    Sign in with Google
                  </button>

                  <p className="text-xs text-center text-muted-foreground">
                    You'll be redirected to Google to sign in securely.
                  </p>
                </div>
              </div>

              {/* Features preview */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4">SkyFlow Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Google Classroom Integration</li>
                  <li>✓ Calendar & Schedule Syncing</li>
                  <li>✓ Attendance Tracking</li>
                  <li>✓ Performance Analytics</li>
                  <li>✓ Real-time Notifications</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>© 2025 SkyFlow. Built for academic excellence.</p>
        </div>
      </footer>
    </div>
  )
}
