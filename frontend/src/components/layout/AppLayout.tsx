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
    <div className="min-h-screen bg-palladian">
      {/* Header */}
      <header className="border-b border-oatmeal/30 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-fantastic to-abyssal-anchorfish rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="w-6 h-6 text-burning-flame" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-fantastic to-abyssal-anchorfish bg-clip-text text-transparent">SkyFlow</h1>
                <p className="text-xs text-truffle-trouble font-medium">Project Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {organizations.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-oatmeal/30 hover:bg-white/80 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-blue-fantastic" />
                    <span className="text-sm font-medium text-blue-fantastic">
                      {selectedOrg?.name || 'Select Team'}
                    </span>
                    {selectedOrg && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(selectedOrg.role).color}`}>
                        {getRoleBadge(selectedOrg.role).label}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-truffle-trouble" />
                  </button>

                  {isOrgDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-oatmeal/30 py-2 z-50">
                      <div className="px-3 py-2 border-b border-oatmeal/30">
                        <p className="text-xs font-semibold text-truffle-trouble uppercase tracking-wider">Your Teams</p>
                      </div>
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            onOrgChange(org)
                            setIsOrgDropdownOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-palladian transition-colors ${
                            selectedOrg?.id === org.id ? 'bg-blue-fantastic/10' : ''
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-blue-fantastic" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-blue-fantastic">{org.name}</p>
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
                <p className="text-sm font-medium text-blue-fantastic">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-truffle-trouble">{user?.email || ''}</p>
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
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white/60 backdrop-blur-sm border-r border-oatmeal/30 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <div className="p-6">
            {/* Dashboard Section */}
            <nav className="mb-6">
              <a href="/" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                <BarChart3 className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                <span>Dashboard</span>
              </a>
            </nav>

            {/* Workspace Section */}
            <div className="border-t border-oatmeal/30 pt-6">
              <h2 className="text-xs font-semibold text-truffle-trouble uppercase tracking-wider mb-4">Workspace</h2>
              <nav className="space-y-1">
                <a href="/projects" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <FolderKanban className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Projects</span>
                </a>
                <a href="/tasks" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <CheckSquare className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Tasks</span>
                </a>
                <a href="/team" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <Users className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Team</span>
                </a>
              </nav>
            </div>

            {/* Google Workspace Section */}
            <div className="mt-8 pt-6 border-t border-oatmeal/30">
              <h2 className="text-xs font-semibold text-truffle-trouble uppercase tracking-wider mb-4">Google Workspace</h2>
              <nav className="space-y-1">
                <a href="/calendar" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <Calendar className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Calendar</span>
                </a>
                <a href="/drive" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <FolderOpen className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Drive</span>
                </a>
                <a href="/sheets" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <FileText className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
                  <span>Sheets</span>
                </a>
                <a href="/analytics" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-fantastic rounded-lg hover:bg-burning-flame/10 hover:text-burning-flame transition-colors group">
                  <BarChart3 className="w-5 h-5 text-truffle-trouble group-hover:text-burning-flame" />
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
