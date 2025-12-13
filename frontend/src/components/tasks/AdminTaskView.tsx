"use client"

import { useState, useEffect } from "react"
import { CheckSquare, Plus, Search, Filter, Calendar, User, AlertCircle, Clock, X } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  assigned_to_name?: string
  due_date: string | null
  created_at: string
  project_id: string | null
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
      setTasks(data.tasks || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
      setIsLoading(false)
    }
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getStatusColumn = (status: Task['status']) => {
    return tasks.filter(task => {
      const matchesStatus = task.status === status
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      return matchesStatus && matchesSearch && matchesPriority
    })
  }

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-fantastic"></div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-fantastic">Tasks</h1>
            <p className="text-truffle-trouble mt-1">Manage all tasks in {organization.name}</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Task</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-truffle-trouble" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-white/60 backdrop-blur-sm rounded-xl border border-oatmeal p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id as Task['status'])}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-fantastic">{column.title}</h3>
              <span className="text-xs px-2 py-1 bg-oatmeal rounded-full text-truffle-trouble">
                {getStatusColumn(column.id as Task['status']).length}
              </span>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {getStatusColumn(column.id as Task['status']).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="bg-white rounded-lg p-4 border border-oatmeal shadow-sm hover:shadow-md transition-shadow cursor-move"
                >
                  <h4 className="font-medium text-blue-fantastic mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-truffle-trouble mb-3 line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-xs flex items-center gap-1 text-truffle-trouble">
                        <Clock className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-fantastic">Create New Task</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-oatmeal/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-truffle-trouble" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-truffle-trouble mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-truffle-trouble mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                  className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-truffle-trouble mb-2">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-truffle-trouble mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-oatmeal rounded-lg hover:bg-oatmeal/30 transition-colors text-truffle-trouble font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title}
                  className="flex-1 px-4 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
