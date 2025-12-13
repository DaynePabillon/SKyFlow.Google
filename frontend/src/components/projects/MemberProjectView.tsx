"use client"

import { useState, useEffect } from "react"
import { FolderKanban, Search, Users, Calendar, CheckCircle2, AlertCircle } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'on-hold' | 'completed'
  start_date: string
  end_date: string
}

interface MemberProjectViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function MemberProjectView({ user, organization }: MemberProjectViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchProjects()
  }, [organization.id])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/organizations/${organization.id}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setProjects(data.projects || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      'on-hold': 'bg-orange-100 text-orange-700',
      completed: 'bg-blue-100 text-blue-700'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-palladian flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-fantastic"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-blue-fantastic">Projects</h1>
            <p className="text-truffle-trouble mt-1">View projects in {organization.name}</p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-truffle-trouble" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">View Only</span>
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 text-center border border-oatmeal">
            <FolderKanban className="w-16 h-16 text-truffle-trouble mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-blue-fantastic mb-2">No projects available</h3>
            <p className="text-truffle-trouble">Your manager will assign you to projects soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-blue-fantastic mb-1">{project.name}</h3>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <p className="text-sm text-truffle-trouble mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                <div className="space-y-2 text-sm text-truffle-trouble">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>0 members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>0 tasks assigned to you</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
