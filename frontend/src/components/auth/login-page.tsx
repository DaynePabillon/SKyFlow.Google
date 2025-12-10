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
    <div className="min-h-screen bg-palladian flex flex-col">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-fantastic/10 via-burning-flame/5 to-truffle-trouble/10 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-fantastic to-abyssal-anchorfish rounded-xl mb-4 shadow-lg">
              <Cloud className="w-8 h-8 text-burning-flame" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-fantastic to-abyssal-anchorfish bg-clip-text text-transparent mb-2">SkyFlow</h1>
            <p className="text-lg text-truffle-trouble">Unified Academic Collaboration Platform</p>
          </div>

          {/* Role Selection */}
          {!selectedRole ? (
            <div className="space-y-4">
              <p className="text-center text-blue-fantastic font-semibold mb-6">Select your role to continue</p>
              <div className="grid md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id as any)}
                    className="p-6 rounded-xl border-2 border-oatmeal hover:border-burning-flame hover:bg-white/80 transition-all duration-200 group shadow-sm hover:shadow-lg"
                  >
                    <div className="text-4xl mb-3">{role.icon}</div>
                    <h3 className="font-semibold text-blue-fantastic mb-2">{role.name}</h3>
                    <p className="text-sm text-truffle-trouble">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-oatmeal shadow-lg">
                <div className="mb-6">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="text-sm text-truffle-trouble hover:text-blue-fantastic mb-4 transition-colors"
                  >
                    ← Back to role selection
                  </button>
                  <h2 className="text-2xl font-bold text-blue-fantastic">
                    Sign in as {roles.find((r) => r.id === selectedRole)?.name}
                  </h2>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-fantastic to-abyssal-anchorfish text-white hover:shadow-lg transition-all duration-200 font-medium"
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
