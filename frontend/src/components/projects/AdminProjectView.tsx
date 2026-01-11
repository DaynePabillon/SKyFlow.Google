"use client"

import { useState, useEffect } from "react"
import { FolderKanban, Plus, Search, Filter, MoreVertical, Users, Calendar, CheckCircle2, X, Trash2 } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'on-hold' | 'completed'
  start_date: string
  end_date: string
  created_at: string
  task_count?: number
}

interface AdminProjectViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function AdminProjectView({ user, organization }: AdminProjectViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'on-hold' | 'completed',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })
  const [isCreating, setIsCreating] = useState(false)

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

  const handleCreateProject = async () => {
    if (!newProject.name) return

    setIsCreating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization_id: organization.id,
          name: newProject.name,
          description: newProject.description,
          status: newProject.status,
          start_date: newProject.start_date,
          end_date: newProject.end_date || null
        })
      })

      if (response.ok) {
        await fetchProjects()
        setIsCreateModalOpen(false)
        setNewProject({
          name: '',
          description: '',
          status: 'planning',
          start_date: new Date().toISOString().split('T')[0],
          end_date: ''
        })
      } else {
        const error = await response.json()
        console.error('Failed to create project:', error)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all tasks in this project.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchProjects()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Don't show anything during initial load to avoid flash
  if (isLoading) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Projects</h1>
            <p className="text-gray-600 mt-1">Manage all projects in {organization.name}</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Project</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/40 shadow-lg">
          <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to get started</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{project.name}</h3>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteProject(project.id)
                  }}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description || 'No description'}
              </p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No start date'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{project.task_count || 0} tasks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-white/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                📁 Create New Project
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                  className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                  className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="planning">📋 Planning</option>
                    <option value="active">🚀 Active</option>
                    <option value="on-hold">⏸️ On Hold</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={newProject.end_date}
                  min={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProject.name || isCreating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Project ✓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
