"use client"

import { API_URL } from '@/lib/api/client'
import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, FolderKanban, CheckSquare, Calendar, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"

interface AnalyticsData {
  totalProjects: number
  totalTasks: number
  totalMembers: number
  completedTasks: number
  projectsByStatus: {
    planning: number
    active: number
    onHold: number
    completed: number
  }
  tasksByPriority: {
    high: number
    medium: number
    low: number
  }
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProjects: 0,
    totalTasks: 0,
    totalMembers: 1,
    completedTasks: 0,
    projectsByStatus: { planning: 0, active: 0, onHold: 0, completed: 0 },
    tasksByPriority: { high: 0, medium: 0, low: 0 },
    recentActivity: []
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    const storedOrgs = localStorage.getItem("organizations")

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        const orgsData = storedOrgs ? JSON.parse(storedOrgs) : []
        setUser(userData)
        setOrganizations(orgsData)
        if (orgsData.length > 0) {
          setSelectedOrg(orgsData[0])
        }
      } catch (e) {
        console.error('Error parsing stored user data:', e)
      }
    }

    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Authentication failed')
          return res.json()
        })
        .then(data => {
          const { organizations, ...userData } = data
          setUser(userData)
          setOrganizations(organizations || [])
          if (organizations && organizations.length > 0) {
            setSelectedOrg(organizations[0])
          }
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('organizations', JSON.stringify(organizations || []))
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch user info:', err)
          setIsLoading(false)
        })
    } else {
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

      // Simulate API call - replace with actual endpoint when available
      setTimeout(() => {
        setAnalytics({
          totalProjects: 0,
          totalTasks: 0,
          totalMembers: 1,
          completedTasks: 0,
          projectsByStatus: { planning: 0, active: 0, onHold: 0, completed: 0 },
          tasksByPriority: { high: 0, medium: 0, low: 0 },
          recentActivity: []
        })
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setLoading(false)
    }
  }

  const completionRate = analytics.totalTasks > 0
    ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
    : 0

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AppLayout
      user={user}
      organizations={organizations}
      selectedOrg={selectedOrg}
      onOrgChange={setSelectedOrg}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Analytics</h1>
            <p className="text-gray-600 mt-1">Workspace insights and metrics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">
            <Download className="w-4 h-4" />
            <span className="font-medium">Export Report</span>
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderKanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Total Projects</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{analytics.totalProjects}</p>
                <p className="text-xs text-gray-600 mt-1">Active projects</p>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Total Tasks</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{analytics.totalTasks}</p>
                <p className="text-xs text-gray-600 mt-1">{analytics.completedTasks} completed</p>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Team Members</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{analytics.totalMembers}</p>
                <p className="text-xs text-gray-600 mt-1">Active members</p>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{completionRate}%</p>
                <p className="text-xs text-gray-600 mt-1">Overall progress</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projects by Status */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Projects by Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Planning</span>
                      <span className="text-sm font-medium text-gray-800">{analytics.projectsByStatus.planning}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Active</span>
                      <span className="text-sm font-medium text-gray-800">{analytics.projectsByStatus.active}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">On Hold</span>
                      <span className="text-sm font-medium text-gray-800">{analytics.projectsByStatus.onHold}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-sm font-medium text-gray-800">{analytics.projectsByStatus.completed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks by Priority */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Priority</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">High Priority</span>
                      <span className="text-sm font-medium text-gray-800">{analytics.tasksByPriority.high}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Medium Priority</span>
                      <span className="text-sm font-medium text-gray-800">{analytics.tasksByPriority.medium}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Low Priority</span>
                      <span className="text-sm font-medium text-gray-800">{analytics.tasksByPriority.low}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              {analytics.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
