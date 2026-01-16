"use client"

import { API_URL } from '@/lib/api/client'
import { useState, useEffect } from "react"
import { TrendingUp, Users, FolderKanban, CheckSquare, Calendar, X, FileText, BarChart3, Target, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

interface OnboardingPreferences {
  purpose?: string
  role?: string
  teamSize?: string
  focusAreas?: string[]
  hearAbout?: string
  completedAt?: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date?: string
}

interface Project {
  id: string
  name: string
  status: string
}

interface Member {
  user_id: string
  name: string
  email: string
  role: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [preferences, setPreferences] = useState<OnboardingPreferences | null>(null)

  // Dashboard data state
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<Member[]>([])


  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")
      const storedOrgs = localStorage.getItem("organizations")
      const selectedOrgStored = localStorage.getItem("selectedOrganization")
      const storedPreferences = localStorage.getItem("onboardingPreferences")

      // Load preferences from localStorage
      if (storedPreferences) {
        try {
          setPreferences(JSON.parse(storedPreferences))
        } catch (e) {
          console.error('Error parsing stored preferences:', e)
        }
      }

      // Load from localStorage first as fallback
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          const orgsData = storedOrgs ? JSON.parse(storedOrgs) : []
          setUser(userData)
          setOrganizations(orgsData)

          // Also load preferences from user data if available
          if (userData.onboarding_data) {
            setPreferences(userData.onboarding_data)
          }

          // Check if user has selected org or if there's only one
          if (selectedOrgStored) {
            setSelectedOrg(JSON.parse(selectedOrgStored))
          } else if (orgsData.length === 1) {
            setSelectedOrg(orgsData[0])
          } else if (orgsData.length > 1) {
            // Multiple orgs but none selected - redirect to workspace selection
            router.push('/select-workspace')
            return
          } else if (!orgsData || orgsData.length === 0) {
            // No organizations (new user) - redirect to onboarding
            router.push('/onboarding')
            return
          }
        } catch (e) {
          console.error('Error parsing stored user data:', e)
        }
      }

      if (storedToken) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })

          if (!res.ok) {
            throw new Error('Authentication failed')
          }

          const data = await res.json()
          const { organizations, onboarding_data, ...userData } = data
          setUser(userData)
          setOrganizations(organizations || [])

          // Set preferences from API response
          if (onboarding_data) {
            setPreferences(onboarding_data)
            localStorage.setItem('onboardingPreferences', JSON.stringify(onboarding_data))
          }

          // Workspace resolution logic
          if (selectedOrgStored) {
            setSelectedOrg(JSON.parse(selectedOrgStored))
          } else if (organizations && organizations.length === 1) {
            setSelectedOrg(organizations[0])
            localStorage.setItem('selectedOrganization', JSON.stringify(organizations[0]))
          } else if (organizations && organizations.length > 1) {
            // Multiple workspaces - redirect to selection
            router.push('/select-workspace')
            return
          } else if (!organizations || organizations.length === 0) {
            // No organizations (new user) - redirect to onboarding
            router.push('/onboarding')
            return
          }

          // Store in localStorage for future use
          localStorage.setItem('user', JSON.stringify({ ...userData, onboarding_data }))
          localStorage.setItem('organizations', JSON.stringify(organizations || []))
        } catch (err) {
          console.error('Failed to fetch user info:', err)
          // Clear invalid token
          if (!storedUser) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('organizations')
          }
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Fetch dashboard data when organization is selected
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedOrg) return

      const token = localStorage.getItem('token')
      if (!token) return

      try {
        // Fetch tasks, projects, and members in parallel
        const [tasksRes, projectsRes, membersRes] = await Promise.all([
          fetch(`${API_URL}/api/organizations/${selectedOrg.id}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/organizations/${selectedOrg.id}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/organizations/${selectedOrg.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData.tasks || [])
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.projects || [])
        }

        if (membersRes.ok) {
          const membersData = await membersRes.json()
          setMembers(membersData.members || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [selectedOrg])


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/landing')
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <p className="text-gray-600">No organization selected</p>
      </div>
    )
  }

  // Handler to update selected org and persist to localStorage
  const handleOrgChange = (org: Organization) => {
    setSelectedOrg(org)
    localStorage.setItem('selectedOrganization', JSON.stringify(org))
  }

  return (
    <AppLayout
      user={user}
      organizations={organizations}
      selectedOrg={selectedOrg}
      onOrgChange={handleOrgChange}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Welcome back, {user.name}
            {preferences?.role && (
              <span className="text-gray-500"> · {preferences.role}</span>
            )}
          </p>
          {preferences?.focusAreas && preferences.focusAreas.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Focused on: {preferences.focusAreas.slice(0, 3).join(', ')}
              {preferences.focusAreas.length > 3 && ` +${preferences.focusAreas.length - 3} more`}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Projects</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{projects.filter(p => p.status === 'active').length}</p>
            <p className="text-xs text-gray-600 mt-1">{projects.length} total projects</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Tasks</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{tasks.filter(t => t.status !== 'done' && t.status !== 'completed' && t.status !== 'archived').length}</p>
            <p className="text-xs text-gray-600 mt-1">{tasks.length} total tasks</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Team</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{members.length}</p>
            <p className="text-xs text-gray-600 mt-1">Team members</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Progress</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done' || t.status === 'completed').length / tasks.length) * 100) : 0}%</p>
            <p className="text-xs text-gray-600 mt-1">Overall completion</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/projects" className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:border-transparent transition-all duration-300 group hover:shadow-md">
              <FolderKanban className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-white transition-colors">View Projects</p>
                <p className="text-xs text-gray-600 group-hover:text-white/80 transition-colors">Manage your projects</p>
              </div>
            </a>
            <a href="/tasks" className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:border-transparent transition-all duration-300 group hover:shadow-md">
              <CheckSquare className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-white transition-colors">View Tasks</p>
                <p className="text-xs text-gray-600 group-hover:text-white/80 transition-colors">Check your tasks</p>
              </div>
            </a>
            <a href="/team" className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:border-transparent transition-all duration-300 group hover:shadow-md">
              <Users className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-white transition-colors">View Team</p>
                <p className="text-xs text-gray-600 group-hover:text-white/80 transition-colors">Manage team members</p>
              </div>
            </a>
          </div>
        </div>

        {/* Recommended For You - Based on Onboarding Preferences */}
        {preferences?.focusAreas && preferences.focusAreas.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Recommended For You</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Based on your focus areas selected during setup</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preferences.focusAreas.includes('Project management') && (
                <a href="/projects" className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <FolderKanban className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Start a Project</p>
                    <p className="text-xs text-gray-500">Create your first project</p>
                  </div>
                </a>
              )}
              {(preferences.focusAreas.includes('Task management') || preferences.focusAreas.includes('Group assignments')) && (
                <a href="/tasks" className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Manage Tasks</p>
                    <p className="text-xs text-gray-500">Organize your work</p>
                  </div>
                </a>
              )}
              {(preferences.focusAreas.includes('Resource management') || preferences.focusAreas.includes('Student organizations')) && (
                <a href="/team" className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Invite Team</p>
                    <p className="text-xs text-gray-500">Collaborate together</p>
                  </div>
                </a>
              )}
              {(preferences.focusAreas.includes('Academic research') || preferences.focusAreas.includes('Portfolio management')) && (
                <a href="/drive" className="flex items-center gap-3 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Upload Files</p>
                    <p className="text-xs text-gray-500">Store your research</p>
                  </div>
                </a>
              )}
              {(preferences.focusAreas.includes('Curriculum and Syllabus management') || preferences.focusAreas.includes('Administrative work')) && (
                <a href="/calendar" className="flex items-center gap-3 p-4 bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                  <div className="p-2 bg-rose-500 rounded-lg">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Set Schedule</p>
                    <p className="text-xs text-gray-500">Plan your timeline</p>
                  </div>
                </a>
              )}
              {(preferences.focusAreas.includes('Goals and strategy') || preferences.focusAreas.includes('Business operations')) && (
                <a href="/analytics" className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl hover:shadow-md transition-all duration-300 group">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">View Analytics</p>
                    <p className="text-xs text-gray-500">Track progress</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">Recent Activity</h2>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent activity</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
