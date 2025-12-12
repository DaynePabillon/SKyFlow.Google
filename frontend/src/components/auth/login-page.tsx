"use client"

import { useState } from "react"
import { Cloud } from "lucide-react"

interface LoginPageProps {
  onLogin: (role: "student" | "teacher") => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleGoogleLogin = async () => {
    if (!selectedRole) return
    
    setIsLoading(true)
    try {
      // Get OAuth URL from backend
      const response = await fetch(`http://localhost:3001/api/auth/google?role=${selectedRole}`)
      const data = await response.json()
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl
    } catch (error) {
      console.error('Failed to initiate Google login:', error)
      alert('Failed to connect to authentication server. Please try again.')
      setIsLoading(false)
    }
  }

  const roles = [
    {
      id: "student",
      name: "Student",
      description: "View assignments, grades, and attendance",
    },
    {
      id: "teacher",
      name: "Educator",
      description: "Create assignments, manage classes, track performance",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-sky-100 to-cyan-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large floating cloud - top left */}
        <div className="absolute top-10 left-5 md:top-20 md:left-10 w-32 h-16 opacity-40 animate-cloud-float">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-2 w-10 h-10 bg-white rounded-full opacity-80"></div>
            <div className="absolute top-1 left-6 w-12 h-12 bg-white rounded-full opacity-70"></div>
            <div className="absolute top-0 left-10 w-10 h-10 bg-white rounded-full opacity-80"></div>
          </div>
        </div>

        {/* Medium cloud - top right */}
        <div className="absolute top-16 right-8 md:right-16 w-28 h-14 opacity-35 animate-cloud-float" style={{ animationDelay: "2s", animationDuration: "12s" }}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-1 w-9 h-9 bg-white rounded-full opacity-80"></div>
            <div className="absolute top-1 left-5 w-11 h-11 bg-white rounded-full opacity-70"></div>
            <div className="absolute top-0 left-9 w-9 h-9 bg-white rounded-full opacity-80"></div>
          </div>
        </div>

        {/* Small cloud - middle right */}
        <div className="absolute top-1/3 right-5 md:right-12 w-24 h-12 opacity-30 animate-cloud-float" style={{ animationDelay: "4s", animationDuration: "14s" }}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white rounded-full blur-2xl"></div>
            <div className="absolute top-0 left-1 w-8 h-8 bg-white rounded-full opacity-80"></div>
            <div className="absolute top-1 left-4 w-9 h-9 bg-white rounded-full opacity-70"></div>
          </div>
        </div>

        {/* Bottom left cloud */}
        <div className="absolute bottom-20 left-10 md:left-20 w-36 h-18 opacity-25 animate-cloud-float" style={{ animationDelay: "3s", animationDuration: "16s" }}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-0 left-2 w-11 h-11 bg-white rounded-full opacity-70"></div>
            <div className="absolute top-1 left-7 w-12 h-12 bg-white rounded-full opacity-60"></div>
            <div className="absolute top-0 left-12 w-10 h-10 bg-white rounded-full opacity-70"></div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl">
        
        {/* Large Cloud Illustration at Top */}
        <div className="mb-8 md:mb-12 animate-bounce-slow">
          <div className="relative w-32 h-24 md:w-48 md:h-36">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/40 to-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
            
            {/* Main cloud shape */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Cloud container */}
                <svg
                  viewBox="0 0 200 120"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#e0f2fe" />
                    </linearGradient>
                  </defs>
                  {/* Large cloud */}
                  <ellipse cx="40" cy="70" rx="35" ry="35" fill="url(#cloudGradient)" opacity="0.95" />
                  <ellipse cx="100" cy="50" rx="45" ry="40" fill="url(#cloudGradient)" opacity="0.98" />
                  <ellipse cx="160" cy="70" rx="35" ry="35" fill="url(#cloudGradient)" opacity="0.95" />
                  <ellipse cx="70" cy="85" rx="30" ry="25" fill="url(#cloudGradient)" opacity="0.9" />
                  <ellipse cx="130" cy="80" rx="30" ry="25" fill="url(#cloudGradient)" opacity="0.9" />
                  {/* Highlight */}
                  <ellipse cx="100" cy="55" rx="20" ry="15" fill="white" opacity="0.4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Card */}
        <div className="w-full max-w-md">
          <div className="rounded-3xl shadow-2xl backdrop-blur-sm border border-white/40 bg-white/70 overflow-hidden transform transition hover:shadow-3xl duration-300">
            
            {/* Card Content */}
            <div className="p-8 md:p-10">
              
              {/* Logo Section */}
              <div className="text-center mb-8 md:mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl mb-5 shadow-lg transform transition hover:scale-110 duration-300 hover:shadow-2xl">
                  <Cloud className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3 tracking-tight">
                  SkyFlow
                </h1>
                <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed">
                  Unified Academic Collaboration Platform
                </p>
              </div>

              {/* Role Selection or Login Section */}
              {!selectedRole ? (
                <div className="space-y-4 md:space-y-5">
                  <p className="text-center text-gray-500 text-sm font-light mb-6">Select your role to continue</p>
                  
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id as any)}
                        className="w-full group relative overflow-hidden rounded-2xl p-4 md:p-5 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm hover:shadow-md"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                        
                        <div className="relative text-left">
                          <h3 className="font-semibold text-gray-800 text-lg md:text-xl">{role.name}</h3>
                          <p className="text-gray-500 text-xs md:text-sm mt-1">{role.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <button
                      onClick={() => setSelectedRole(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors font-light"
                    >
                      ← Back to role selection
                    </button>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      Sign in as {roles.find((r) => r.id === selectedRole)?.name}
                    </h2>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 md:py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {isLoading ? 'Signing in...' : 'Sign in with Google'}
                  </button>

                  <p className="text-xs text-center text-gray-500 font-light">
                    You'll be redirected to Google to sign in securely.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-gray-500 mt-6 md:mt-8 font-light">
            © 2025 SkyFlow. Built for academic excellence.
          </footer>
        </div>
      </div>
    </div>
  )
}
