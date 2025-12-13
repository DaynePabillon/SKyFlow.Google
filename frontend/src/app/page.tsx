"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, FolderKanban, CheckSquare, Calendar, X } from "lucide-react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")
      const storedOrgs = localStorage.getItem("organizations")
      
      // Load from localStorage first as fallback
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
      
      if (storedToken) {
        try {
          const res = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })
          
          if (!res.ok) {
            throw new Error('Authentication failed')
          }
          
          const data = await res.json()
          const { organizations, ...userData } = data
          setUser(userData)
          setOrganizations(organizations || [])
          if (organizations && organizations.length > 0) {
            setSelectedOrg(organizations[0])
          }
          // Store in localStorage for future use
          localStorage.setItem('user', JSON.stringify(userData))
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
  }, [])

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

  return (
    <AppLayout
      user={user}
      organizations={organizations}
      selectedOrg={selectedOrg}
      onOrgChange={setSelectedOrg}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-600 mt-2 text-lg">Welcome back, {user.name}</p>
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
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">0</p>
            <p className="text-xs text-gray-600 mt-1">Active projects</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Tasks</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">0</p>
            <p className="text-xs text-gray-600 mt-1">Pending tasks</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Team</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">1</p>
            <p className="text-xs text-gray-600 mt-1">Team members</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Progress</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">0%</p>
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

        {/* Recent Activity Placeholder */}
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
