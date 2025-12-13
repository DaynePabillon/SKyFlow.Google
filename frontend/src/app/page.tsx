"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, FolderKanban, CheckSquare, Calendar, X } from "lucide-react"
import LoginPage from "@/components/auth/login-page"
import AppLayout from "@/components/layout/AppLayout"

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
      fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Authentication failed')
          }
          return res.json()
        })
        .then(data => {
          // Backend returns user data at root level, not nested
          const { organizations, ...userData } = data
          setUser(userData)
          setOrganizations(organizations || [])
          if (organizations && organizations.length > 0) {
            setSelectedOrg(organizations[0])
          }
          // Store in localStorage for future use
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('organizations', JSON.stringify(organizations || []))
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch user info:', err)
          // Use cached data if API fails
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-palladian flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-fantastic"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-palladian flex items-center justify-center">
        <p className="text-truffle-trouble">No organization selected</p>
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
          <h1 className="text-3xl font-bold text-blue-fantastic">Dashboard</h1>
          <p className="text-truffle-trouble mt-1">Welcome back, {user.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderKanban className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-truffle-trouble">Projects</span>
            </div>
            <p className="text-3xl font-bold text-blue-fantastic">0</p>
            <p className="text-xs text-truffle-trouble mt-1">Active projects</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-truffle-trouble">Tasks</span>
            </div>
            <p className="text-3xl font-bold text-blue-fantastic">0</p>
            <p className="text-xs text-truffle-trouble mt-1">Pending tasks</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-truffle-trouble">Team</span>
            </div>
            <p className="text-3xl font-bold text-blue-fantastic">1</p>
            <p className="text-xs text-truffle-trouble mt-1">Team members</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-truffle-trouble">Progress</span>
            </div>
            <p className="text-3xl font-bold text-blue-fantastic">0%</p>
            <p className="text-xs text-truffle-trouble mt-1">Overall completion</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-blue-fantastic mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/projects" className="flex items-center gap-3 p-4 border border-oatmeal rounded-lg hover:bg-palladian transition-colors">
              <FolderKanban className="w-5 h-5 text-blue-fantastic" />
              <div>
                <p className="font-medium text-blue-fantastic">View Projects</p>
                <p className="text-xs text-truffle-trouble">Manage your projects</p>
              </div>
            </a>
            <a href="/tasks" className="flex items-center gap-3 p-4 border border-oatmeal rounded-lg hover:bg-palladian transition-colors">
              <CheckSquare className="w-5 h-5 text-blue-fantastic" />
              <div>
                <p className="font-medium text-blue-fantastic">View Tasks</p>
                <p className="text-xs text-truffle-trouble">Check your tasks</p>
              </div>
            </a>
            <a href="/team" className="flex items-center gap-3 p-4 border border-oatmeal rounded-lg hover:bg-palladian transition-colors">
              <Users className="w-5 h-5 text-blue-fantastic" />
              <div>
                <p className="font-medium text-blue-fantastic">View Team</p>
                <p className="text-xs text-truffle-trouble">Manage team members</p>
              </div>
            </a>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm">
          <h2 className="text-xl font-semibold text-blue-fantastic mb-4">Recent Activity</h2>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-truffle-trouble mx-auto mb-4 opacity-50" />
            <p className="text-truffle-trouble">No recent activity</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
