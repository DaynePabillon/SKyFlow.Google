"use client"

import { API_URL } from '@/lib/api/client'
import { useState, useEffect } from "react"
import { CheckSquare, Search, LayoutGrid, Table, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import ProfessionalTaskCard from "./ProfessionalTaskCard"

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  assigned_to_name?: string
  due_date: string | null
  created_at: string
  project_id: string | null
  project_name?: string
}

interface MemberTaskViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function MemberTaskView({ user, organization }: MemberTaskViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    fetchMyTasks()
  }, [organization.id])

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      // Fetch all tasks and filter to user's assigned tasks
      const response = await fetch(`${API_URL}/api/organizations/${organization.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filter to only tasks assigned to this user
        const myTasks = (data.tasks || []).filter((t: Task) => t.assigned_to === user.id)
        setTasks(myTasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      fetchMyTasks()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.status !== 'archived' &&
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(t => t.status === status)
  }

  const stats = {
    total: filteredTasks.length,
    todo: getTasksByStatus('todo').length,
    inProgress: getTasksByStatus('in-progress').length,
    review: getTasksByStatus('review').length,
    done: getTasksByStatus('done').length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                My Tasks
              </h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                Member
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Tasks assigned to you in {organization.name}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">
              Can update status
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-700">{stats.todo}</div>
            <div className="text-sm text-gray-500">To Do</div>
          </div>
          <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
            <div className="text-sm text-blue-600">In Progress</div>
          </div>
          <div className="bg-yellow-50/80 rounded-xl p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{stats.review}</div>
            <div className="text-sm text-yellow-600">Review</div>
          </div>
          <div className="bg-green-50/80 rounded-xl p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.done}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
        </div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/40 shadow-lg">
          <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Tasks Assigned
          </h3>
          <p className="text-gray-600">
            You don't have any tasks assigned to you yet.
          </p>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && filteredTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="relative">
              <ProfessionalTaskCard
                task={task as any}
                onClick={() => { }}
                onStatusChange={(taskId, status) => handleStatusChange(taskId, status as Task['status'])}
              />
              {/* Status Update Overlay for Members */}
              <div className="absolute bottom-2 right-2">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                  className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredTasks.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Task</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-blue-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{task.title}</div>
                    {task.project_name && <div className="text-xs text-gray-400">{task.project_name}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-700' :
                      task.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.due_date ? (
                      <span className={new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500 font-medium' : ''}>
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                      className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
