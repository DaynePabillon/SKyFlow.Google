"use client"

import { useState, useEffect } from "react"
import { CheckSquare, Plus, Search, LayoutGrid, Table, X, Calendar, AlertCircle, User, Edit3 } from "lucide-react"
import BoardingPassCard from "./BoardingPassCard"
import CloudGroup from "./CloudGroup"
import ProfessionalTaskCard from "./ProfessionalTaskCard"
import ProfessionalKanban from "./ProfessionalKanban"
import { useThemeMode } from "@/context/ThemeContext"

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

interface ManagerTaskViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function ManagerTaskView({ user, organization }: ManagerTaskViewProps) {
  const { isProfessionalMode, isAviationMode } = useThemeMode()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: ''
  })
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async () => {
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
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '' })
        setIsCreateModalOpen(false)
        fetchTasks()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      fetchTasks()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditModalOpen(true)
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          due_date: editingTask.due_date,
          assigned_to: editingTask.assigned_to
        })
      })
      if (response.ok) {
        setIsEditModalOpen(false)
        setEditingTask(null)
        fetchTasks()
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
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
    await handleStatusChange(taskId, newStatus)
  }

  const getStatusColumn = (status: Task['status']) => {
    return tasks.filter(task => {
      const matchesStatus = task.status === status
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
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
    { id: 'todo', title: isProfessionalMode ? '📋 To Do' : '✈️ Boarding' },
    { id: 'in-progress', title: isProfessionalMode ? '🔄 In Progress' : '🌤️ In Flight' },
    { id: 'review', title: isProfessionalMode ? '👀 Review' : '🌅 Landing' },
    { id: 'done', title: isProfessionalMode ? '✅ Done' : '🎯 Arrived' }
  ]

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
                {isProfessionalMode ? 'Team Tasks' : 'Flight Control ✈️'}
              </h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                Manager
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              {isProfessionalMode
                ? `Manage team tasks in ${organization.name}`
                : `Manage team flights in ${organization.name}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'board'
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
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">{isProfessionalMode ? 'New Task' : 'New Flight'}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={isProfessionalMode ? "Search tasks..." : "Search flights..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        isProfessionalMode ? (
          <ProfessionalKanban
            tasks={tasks.filter(t => t.status !== 'archived') as any}
            onTaskClick={(task) => handleEditTask(task as Task)}
            onAddTask={() => setIsCreateModalOpen(true)}
          />
        ) : (
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
                    onClick={() => handleEditTask(task)}
                  />
                ))}
              </CloudGroup>
            ))}
          </div>
        )
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">{isProfessionalMode ? 'Task' : 'Flight'}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">{isProfessionalMode ? 'Priority' : 'Class'}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">{isProfessionalMode ? 'Assignee' : 'Crew'}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.filter(t => t.status !== 'archived').map((task) => (
                <tr key={task.id} className="hover:bg-blue-50/50 cursor-pointer" onClick={() => handleEditTask(task)}>
                  <td className="px-6 py-4 font-medium text-gray-800">{task.title}</td>
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
                      {isProfessionalMode
                        ? (task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low')
                        : (task.priority === 'high' ? 'First Class' : task.priority === 'medium' ? 'Business' : 'Economy')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.assigned_to_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                      className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{isProfessionalMode ? 'No tasks yet' : 'No flights scheduled'}</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {isProfessionalMode ? '📋 Create New Task' : '✈️ Schedule New Flight'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isProfessionalMode ? 'Task Title' : 'Flight Name'}
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                  placeholder={isProfessionalMode ? "Enter task title" : "Enter flight name"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isProfessionalMode ? 'Priority' : 'Class'}
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  >
                    <option value="high">{isProfessionalMode ? 'High' : 'First Class'}</option>
                    <option value="medium">{isProfessionalMode ? 'Medium' : 'Business'}</option>
                    <option value="low">{isProfessionalMode ? 'Low' : 'Economy'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateTask}
                disabled={!newTask.title.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isProfessionalMode ? 'Create Task' : 'Schedule Flight'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {isProfessionalMode ? '✏️ Edit Task' : '✏️ Edit Flight'}
              </h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isProfessionalMode ? 'Task Title' : 'Flight Name'}
                </label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isProfessionalMode ? 'Priority' : 'Class'}
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="high">{isProfessionalMode ? '🔴 High Priority' : '✈️ First Class'}</option>
                    <option value="medium">{isProfessionalMode ? '🟡 Medium Priority' : '💼 Business'}</option>
                    <option value="low">{isProfessionalMode ? '🟢 Low Priority' : '🎫 Economy'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  disabled={!editingTask.title.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium disabled:opacity-50 hover:from-blue-600 hover:to-cyan-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
