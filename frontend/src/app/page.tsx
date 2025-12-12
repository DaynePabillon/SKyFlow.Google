"use client"

import { useState, useEffect } from "react"
import { Cloud, LogOut, Menu, X, Calendar, FileText, FolderOpen, BarChart3, Users, BookOpen } from "lucide-react"
import StudentDashboard from "@/components/dashboards/student-dashboard"
import TeacherDashboard from "@/components/dashboards/teacher-dashboard"
import LoginPage from "@/components/auth/login-page"

type UserRole = "student" | "teacher"

export default function Home() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userName, setUserName] = useState("Alex Chen")
  const [isLoading, setIsLoading] = useState(true)

  // Check for stored authentication on mount
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as UserRole | null
    const storedToken = localStorage.getItem("token")
    
    if (storedRole && storedToken) {
      setUserRole(storedRole)
      
      // Fetch user info from backend
      fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setUserName(data.name)
          }
        })
        .catch(err => console.error('Failed to fetch user info:', err))
    }
    setIsLoading(false)
  }, [])

  if (!userRole) {
    return (
      <LoginPage
        onLogin={(role) => {
          setUserRole(role)
          setIsMenuOpen(false)
        }}
      />
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userRole")
    setUserRole(null)
    setUserName("Alex Chen")
  }

  const getDashboard = () => {
    switch (userRole) {
      case "student":
        return <StudentDashboard userName={userName} />
      case "teacher":
        return <TeacherDashboard userName={userName} />
    }
  }

  const getRoleName = () => {
    const names = {
      student: "Student",
      teacher: "Educator",
    }
    return names[userRole]
  }

  return (
    <div className="min-h-screen bg-palladian">
      {/* Header with Glass Effect */}
      <header className="border-b border-oatmeal/30 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-fantastic to-abyssal-anchorfish rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="w-6 h-6 text-burning-flame" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-fantastic to-abyssal-anchorfish bg-clip-text text-transparent">SkyFlow</h1>
                <p className="text-xs text-truffle-trouble font-medium">{getRoleName()} Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium text-blue-fantastic">{userName}</p>
                <p className="text-xs text-truffle-trouble">{userRole}</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-oatmeal/30 rounded-lg transition-colors">
                <LogOut className="w-5 h-5 text-truffle-trouble hover:text-blue-fantastic" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border flex flex-col gap-3">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-destructive"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white/60 backdrop-blur-sm border-r border-oatmeal/30 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <div className="p-6">
            <h2 className="text-xs font-semibold text-truffle-trouble uppercase tracking-wider mb-4">Google Services</h2>
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                <BookOpen className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                <span>Classroom</span>
                <span className="ml-auto text-xs text-oatmeal">Soon</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                <FileText className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                <span>Sheets</span>
                <span className="ml-auto text-xs text-oatmeal">Soon</span>
              </button>
              <button 
                onClick={() => window.location.href = '/calendar'}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group"
              >
                <Calendar className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                <span>Calendar</span>
              </button>
              <button 
                onClick={() => window.location.href = '/drive'}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group"
              >
                <FolderOpen className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                <span>Drive</span>
              </button>
            </nav>

            <div className="mt-8 pt-6 border-t border-oatmeal/30">
              <h2 className="text-xs font-semibold text-truffle-trouble uppercase tracking-wider mb-4">Quick Actions</h2>
              <nav className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <BarChart3 className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Analytics</span>
                  <span className="ml-auto text-xs text-oatmeal">Soon</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <Users className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Attendance</span>
                  <span className="ml-auto text-xs text-oatmeal">Soon</span>
                </button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">{getDashboard()}</main>
      </div>
    </div>
  )
}
