"use client"

import { useState } from "react"
import { Cloud, LogOut, Menu, X, Calendar, FileText, FolderOpen, BarChart3, Users, FolderKanban, CheckSquare, Building2, ChevronDown, Plus, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

interface AppLayoutProps {
  user: any
  organizations: Organization[]
  selectedOrg: Organization | null
  onOrgChange: (org: Organization) => void
  children: React.ReactNode
}

export default function AppLayout({ user, organizations, selectedOrg, onOrgChange, children }: AppLayoutProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
      member: { label: 'Member', color: 'bg-green-100 text-green-700' }
    }
    return badges[role as keyof typeof badges] || badges.member
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-bounce-slow"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-wave"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/40 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">SkyFlow</h1>
                <p className="text-xs text-gray-600 font-medium">Project Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {organizations.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-white/40 hover:bg-white/90 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-800">
                      {selectedOrg?.name || 'Select Team'}
                    </span>
                    {selectedOrg && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(selectedOrg.role).color}`}>
                        {getRoleBadge(selectedOrg.role).label}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {isOrgDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 py-2 z-50">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Your Teams</p>
                      </div>
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            onOrgChange(org)
                            setIsOrgDropdownOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 transition-colors rounded-lg mx-1 ${
                            selectedOrg?.id === org.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-800">{org.name}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(org.role).color}`}>
                            {getRoleBadge(org.role).label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium text-gray-800">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-gray-600">{user?.email || ''}</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-xl transition-all duration-300 group">
                <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white/70 backdrop-blur-xl border-r border-white/40 min-h-[calc(100vh-73px)] sticky top-[73px] shadow-lg">
          <div className="p-6">
            {/* Dashboard Section */}
            <nav className="mb-6">
              <a href="/" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                <BarChart3 className="w-5 h-5 group-hover:text-white transition-colors" />
                <span>Dashboard</span>
              </a>
            </nav>

            {/* Workspace Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4 px-2">Workspace</h2>
              <nav className="space-y-2">
                <a href="/projects" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                  <FolderKanban className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span>Projects</span>
                </a>
                <a href="/tasks" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                  <CheckSquare className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span>Tasks</span>
                </a>
                <a href="/team" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                  <Users className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span>Team</span>
                </a>
              </nav>
            </div>

            {/* Google Workspace Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4 px-2">Google Workspace</h2>
              <nav className="space-y-2">
                <a href="/calendar" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                  <Calendar className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span>Calendar</span>
                </a>
                <a href="/drive" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                  <FolderOpen className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span>Drive</span>
                </a>
                <a href="/sheets" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                  <FileText className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span>Sheets</span>
                </a>
                <a href="/analytics" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md">
                  <BarChart3 className="w-5 h-5 group-hover:text-white transition-colors" />
                  <span>Analytics</span>
                </a>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
