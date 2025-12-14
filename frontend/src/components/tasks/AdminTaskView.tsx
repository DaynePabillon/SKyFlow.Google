"use client"

import { useState, useEffect } from "react"
import { CheckSquare, Plus, Search, Filter, Calendar, User, AlertCircle, Clock, X, LayoutGrid, Table, Archive, ChevronDown, ChevronRight, RotateCcw, Radar } from "lucide-react"
import BoardingPassCard from "./BoardingPassCard"
import CloudGroup from "./CloudGroup"
import ControlTower from "./ControlTower"

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

interface AdminTaskViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function AdminTaskView({ user, organization }: AdminTaskViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'board' | 'table' | 'radar'>('board')
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: ''
  })

  useEffect(() => {
    fetchTasks()
  }, [organization.id])

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/organizations/${organization.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        setTasks([])
        setIsLoading(false)
        return
      }

      const data = await response.json()

      // Normalize status values from database format to frontend format
      const normalizedTasks = (data.tasks || []).map((task: Task) => ({
        ...task,
        status: normalizeStatus(task.status)
      }))

      setTasks(normalizedTasks)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
      setIsLoading(false)
    }
  }

  // Normalize database status values to frontend format
  const normalizeStatus = (status: string): Task['status'] => {
    const statusMap: Record<string, Task['status']> = {
      'in_progress': 'in-progress',
      'in-progress': 'in-progress',
      'todo': 'todo',
      'review': 'review',
      'done': 'done',
      'completed': 'done',
      'archived': 'archived'
    }
    return statusMap[status] || status as Task['status']
  }

  const handleCreateTask = async () => {
    if (!newTask.title) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/organizations/${organization.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTask,
          status: 'todo'
        })
      })

      if (response.ok) {
        fetchTasks()
        setIsCreateModalOpen(false)
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '' })
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')

    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3001/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this flight?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchTasks()
      } else {
        console.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleArchiveTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3001/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'archived' })
      })

      fetchTasks()
    } catch (error) {
      console.error('Error archiving task:', error)
    }
  }

  const handleRestoreTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3001/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'todo' })
      })

      fetchTasks()
    } catch (error) {
      console.error('Error restoring task:', error)
    }
  }

  const getStatusColumn = (status: Task['status']) => {
    return tasks.filter(task => {
      const matchesStatus = task.status === status
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      return matchesStatus && matchesSearch && matchesPriority
    })
  }

  const getCloudStatus = (status: Task['status']): 'healthy' | 'at-risk' | 'overdue' | 'neutral' => {
    const columnTasks = getStatusColumn(status)
    const hasHighPriority = columnTasks.some(t => t.priority === 'high')
    const hasOverdue = columnTasks.some(t => t.due_date && new Date(t.due_date) < new Date())

    if (status === 'done') return 'healthy'
    if (hasOverdue) return 'overdue'
    if (hasHighPriority) return 'at-risk'
    return 'neutral'
  }

  const columns = [
    { id: 'todo', title: '✈️ Boarding', icon: '🛫' },
    { id: 'in-progress', title: '🌤️ In Flight', icon: '✈️' },
    { id: 'review', title: '🌅 Landing', icon: '🛬' },
    { id: 'done', title: '🎯 Arrived', icon: '🏁' }
  ]

  if (isLoading) {
    return null
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Flight Control ✈️
            </h1>
            <p className="text-gray-600 mt-1">Manage all flights in {organization.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'board'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
                title="Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('radar')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'radar'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
                title="Control Tower"
              >
                <Radar className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Flight</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search flights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Classes</option>
            <option value="high">🔴 First Class</option>
            <option value="medium">🟡 Business</option>
            <option value="low">🟢 Economy</option>
          </select>
        </div>
      </div>

      {/* Radar / Control Tower View */}
      {viewMode === 'radar' && (
        <ControlTower tasks={tasks} />
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <CloudGroup
              key={column.id}
              title={column.title}
              count={getStatusColumn(column.id as Task['status']).length}
              status={getCloudStatus(column.id as Task['status'])}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id as Task['status'])}
              onAddTask={column.id === 'todo' ? () => setIsCreateModalOpen(true) : undefined}
            >
              {getStatusColumn(column.id as Task['status']).map((task) => (
                <BoardingPassCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDelete={handleDeleteTask}
                  onArchive={handleArchiveTask}
                />
              ))}
            </CloudGroup>
          ))}
        </div>
      )}

      {/* Archived Section */}
      {getStatusColumn('archived').length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
            className="flex items-center gap-3 w-full text-left p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white/70 transition-colors"
          >
            {isArchiveExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
            <Archive className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-gray-700">📦 Archived Flights</span>
            <span className="text-sm text-gray-500 ml-2">
              ({getStatusColumn('archived').length} {getStatusColumn('archived').length === 1 ? 'flight' : 'flights'})
            </span>
          </button>

          {isArchiveExpanded && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getStatusColumn('archived').map((task) => (
                <div key={task.id} className="relative">
                  <div className="absolute top-2 right-2 z-20">
                    <button
                      onClick={() => handleRestoreTask(task.id)}
                      className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg shadow-md transition-all"
                      title="Restore to Boarding"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div className="opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                    <BoardingPassCard
                      task={task}
                      onDragStart={handleDragStart}
                      onDelete={handleDeleteTask}
                      onArchive={handleArchiveTask}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Flight</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Departure</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Arrival</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Crew</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.filter(task => {
                const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
                return matchesSearch && matchesPriority
              }).map((task) => (
                <tr key={task.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-gray-500">SF-{task.id.slice(-4).toUpperCase()}</span>
                      <span className="font-medium text-gray-800">{task.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-700' :
                      task.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {task.status === 'todo' && '🛫'}
                      {task.status === 'in-progress' && '✈️'}
                      {task.status === 'review' && '🛬'}
                      {task.status === 'done' && '✅'}
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {task.priority === 'high' ? '🔴 First Class' :
                        task.priority === 'medium' ? '🟡 Business' :
                          '🟢 Economy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(task.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '---'}
                  </td>
                  <td className="px-6 py-4">
                    {task.assigned_to_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                          {task.assigned_to_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600">{task.assigned_to_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No flights scheduled yet</p>
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-white/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ✈️ Schedule New Flight
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
                  Flight Name *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter flight name"
                  className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Flight Details
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter flight details"
                  rows={3}
                  className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Class
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="low">🟢 Economy</option>
                    <option value="medium">🟡 Business</option>
                    <option value="high">🔴 First Class</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Flight ✈️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
