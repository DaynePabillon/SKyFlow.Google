"use client"

import { API_URL } from '@/lib/api/client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import ProfessionalKanban from "@/components/tasks/ProfessionalKanban"
import ChartWidget from "@/components/widgets/ChartWidget"
import ChartWidgetPicker from "@/components/widgets/ChartWidgetPicker"
import { FolderKanban, X, Plus, BarChart3, ChevronUp, ChevronDown, FileSpreadsheet, CheckSquare, Calendar, User, MessageSquare, Send, Trash2, Edit3, Clock } from "lucide-react"

interface Task {
    id: string
    title: string
    description: string
    status: 'todo' | 'in-progress' | 'in_progress' | 'review' | 'done' | 'archived'
    priority: 'low' | 'medium' | 'high'
    assigned_to: string | null
    assigned_to_name?: string
    due_date: string | null
    created_at: string
    project_id: string | null
    project_name?: string
    synced?: boolean
    sheet_name?: string
    comment_count?: number
}

interface SyncedSheet {
    id: string
    sheet_id: string
    sheet_name: string
    task_count: number
}

interface TeamMember {
    id: string
    name: string
    email: string
    role: string
}

interface Organization {
    id: string
    name: string
    role: 'admin' | 'manager' | 'member'
}

interface TaskComment {
    id: string
    comment: string
    user_name: string
    user_id: string
    created_at: string
}

interface Widget {
    id: string
    type: string
    title: string
}

export default function BoardsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [syncedSheets, setSyncedSheets] = useState<SyncedSheet[]>([])
    const [members, setMembers] = useState<TeamMember[]>([])
    const [mounted, setMounted] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<string>('all')
    const [widgets, setWidgets] = useState<Widget[]>([])
    const [showWidgetPicker, setShowWidgetPicker] = useState(false)
    const [widgetsExpanded, setWidgetsExpanded] = useState(true)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [taskComments, setTaskComments] = useState<TaskComment[]>([])
    const [newComment, setNewComment] = useState('')
    const [isEditingTask, setIsEditingTask] = useState(false)
    const [editedTask, setEditedTask] = useState<Partial<Task>>({})
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        due_date: '',
        assigned_to: ''
    })

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        const storedOrgs = localStorage.getItem('organizations')
        const storedSelectedOrg = localStorage.getItem('selectedOrganization')
        const storedWidgets = localStorage.getItem('boardWidgets')

        if (storedUser) setUser(JSON.parse(storedUser))
        if (storedOrgs) setOrganizations(JSON.parse(storedOrgs))
        if (storedSelectedOrg) {
            const org = JSON.parse(storedSelectedOrg)
            setSelectedOrg(org)
            fetchData(org.id)
        }
        if (storedWidgets) setWidgets(JSON.parse(storedWidgets))

        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        const token = localStorage.getItem("token")
        if (!token) router.push("/")
    }, [mounted, router])

    const fetchData = async (orgId: string) => {
        await Promise.all([
            fetchTasks(orgId),
            fetchSyncedSheets(orgId),
            fetchMembers(orgId)
        ])
    }

    const fetchTasks = async (orgId: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/organizations/${orgId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                const normalizedTasks = (data.tasks || []).map((task: Task) => ({
                    ...task,
                    status: normalizeStatus(task.status),
                    synced: false
                }))
                setTasks(normalizedTasks)
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

    const fetchSyncedSheets = async (orgId: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/organizations/${orgId}/synced-sheets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setSyncedSheets(data.syncedSheets || [])
            }
        } catch (error) {
            console.error('Error fetching synced sheets:', error)
        }
    }

    const fetchMembers = async (orgId: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/organizations/${orgId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setMembers(Array.isArray(data) ? data : (data.members || []))
            }
        } catch (error) {
            console.error('Error fetching members:', error)
        }
    }

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
        if (!newTask.title || !selectedOrg) return
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/organizations/${selectedOrg.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: newTask.title,
                    description: newTask.description,
                    status: 'todo',
                    priority: newTask.priority,
                    due_date: newTask.due_date || null,
                    assigned_to: newTask.assigned_to || null
                })
            })

            if (response.ok) {
                fetchData(selectedOrg.id)
                setIsCreateModalOpen(false)
                setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' })
            }
        } catch (error) {
            console.error('Error creating task:', error)
        }
    }

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            })
            if (selectedOrg) fetchTasks(selectedOrg.id)
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (selectedOrg) fetchTasks(selectedOrg.id)
        } catch (error) {
            console.error('Error deleting task:', error)
        }
    }

    const handleAddWidget = (type: string, title: string) => {
        const newWidget = { id: Date.now().toString(), type, title }
        const updated = [...widgets, newWidget]
        setWidgets(updated)
        localStorage.setItem('boardWidgets', JSON.stringify(updated))
        setShowWidgetPicker(false)
    }

    const handleRemoveWidget = (widgetId: string) => {
        const updated = widgets.filter(w => w.id !== widgetId)
        setWidgets(updated)
        localStorage.setItem('boardWidgets', JSON.stringify(updated))
    }

    const handleOrgChange = (org: Organization) => {
        setSelectedOrg(org)
        localStorage.setItem('selectedOrganization', JSON.stringify(org))
        fetchData(org.id)
    }

    const handleTaskClick = async (task: Task) => {
        setSelectedTask(task)
        setEditedTask(task)
        setIsEditingTask(false)
        setTaskComments([]) // Clear old comments immediately
        // Fetch comments for this task
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_URL}/api/tasks/${task.id}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTaskComments(data.comments || [])
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
            setTaskComments([])
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedTask) return
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: newComment })
            })
            if (res.ok) {
                const data = await res.json()
                setTaskComments([...taskComments, data.comment])
                setNewComment('')
            }
        } catch (error) {
            console.error('Error adding comment:', error)
        }
    }

    const handleUpdateTask = async () => {
        if (!selectedTask) return
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_URL}/api/tasks/${selectedTask.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editedTask)
            })
            setSelectedTask({ ...selectedTask, ...editedTask } as Task)
            setIsEditingTask(false)
            if (selectedOrg) fetchTasks(selectedOrg.id)
        } catch (error) {
            console.error('Error updating task:', error)
        }
    }

    const handleDeleteSelectedTask = async () => {
        if (!selectedTask) return
        await handleDeleteTask(selectedTask.id)
        setSelectedTask(null)
    }

    const getUserRole = (): 'admin' | 'manager' | 'member' => {
        return selectedOrg?.role || 'member'
    }

    const canEdit = () => ['admin', 'manager'].includes(getUserRole())
    const canDelete = () => getUserRole() === 'admin'

    // Filter tasks based on active tab
    const filteredTasks = tasks.filter(task => {
        if (task.status === 'archived') return false
        if (activeTab === 'all') return true
        if (activeTab === 'general') return !task.synced && !task.sheet_name
        // For sheet tabs, filter by sheet name
        if (task.sheet_name && activeTab === task.sheet_name) return true
        return false
    })

    const generalTaskCount = tasks.filter(t => !t.synced && !t.sheet_name && t.status !== 'archived').length

    if (!mounted || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    if (!selectedOrg) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <p className="text-gray-600">No organization selected</p>
            </div>
        )
    }

    return (
        <AppLayout
            user={user}
            organizations={organizations}
            selectedOrg={selectedOrg}
            onOrgChange={handleOrgChange}
        >
            <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                                <FolderKanban className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                    Project Boards
                                </h1>
                                <p className="text-gray-600">
                                    All Tasks • {filteredTasks.length} tasks
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">New Task</span>
                        </button>
                    </div>
                </div>

                {/* Widgets Section */}
                <div className="mb-6">
                    <button
                        onClick={() => setWidgetsExpanded(!widgetsExpanded)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-3"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Widgets ({widgets.length})</span>
                        {widgetsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {widgetsExpanded && (
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {widgets.map(widget => (
                                <div key={widget.id} className="flex-shrink-0 w-72">
                                    <ChartWidget
                                        type={widget.type}
                                        title={widget.title}
                                        tasks={filteredTasks}
                                        members={members}
                                        onRemove={() => handleRemoveWidget(widget.id)}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setShowWidgetPicker(true)}
                                className="flex-shrink-0 w-48 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                            >
                                <Plus className="w-6 h-6" />
                                <span className="text-sm">Add Widget</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Kanban Board */}
                <ProfessionalKanban
                    tasks={filteredTasks.map(t => ({
                        ...t,
                        description: t.description || undefined,
                        due_date: t.due_date || undefined,
                        project_name: t.project_name || undefined,
                        assigned_to_name: t.assigned_to_name || undefined,
                        comment_count: t.comment_count
                    }))}
                    onStatusChange={handleStatusChange}
                    onAddTask={() => setIsCreateModalOpen(true)}
                    onDeleteTask={handleDeleteTask}
                    onTaskClick={(task) => handleTaskClick(task as Task)}
                />

                {/* Bottom Tab Bar */}
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl rounded-full shadow-xl border border-gray-200 px-2 py-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'all'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <CheckSquare className="w-4 h-4" />
                            All Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'general'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <FolderKanban className="w-4 h-4" />
                            General Tasks
                            <span className="text-xs opacity-80">{generalTaskCount}</span>
                        </button>
                        {/* Dynamic Sheet Tabs */}
                        {syncedSheets.map(sheet => (
                            <button
                                key={sheet.id}
                                onClick={() => setActiveTab(sheet.sheet_name)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === sheet.sheet_name
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                {sheet.sheet_name}
                                <span className="text-xs opacity-80">{sheet.task_count || 0}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => router.push('/workspace-sync')}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Widget Picker Modal */}
            {showWidgetPicker && (
                <ChartWidgetPicker
                    isOpen={showWidgetPicker}
                    onSelectWidget={handleAddWidget}
                    onClose={() => setShowWidgetPicker(false)}
                />
            )}

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Create New Task</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Enter task title"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    rows={3}
                                    placeholder="Enter task description"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select
                                    value={newTask.assigned_to}
                                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTask}
                                disabled={!newTask.title}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
                            >
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${selectedTask.status === 'done' ? 'bg-green-500' :
                                    selectedTask.status === 'in_progress' || selectedTask.status === 'in-progress' ? 'bg-blue-500' :
                                        selectedTask.status === 'review' ? 'bg-purple-500' : 'bg-gray-400'
                                    }`} />
                                <h2 className="text-xl font-bold text-gray-800">Task Details</h2>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Task Title & Description */}
                            <div className="mb-6">
                                {isEditingTask && canEdit() ? (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={editedTask.title || ''}
                                            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                                            className="w-full text-xl font-bold text-gray-800 border border-gray-200 rounded-lg px-3 py-2"
                                        />
                                        <textarea
                                            value={editedTask.description || ''}
                                            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                                            className="w-full h-24 border border-gray-200 rounded-lg px-3 py-2 resize-none"
                                            placeholder="Task description..."
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedTask.title}</h3>
                                        <p className="text-gray-600">{selectedTask.description || 'No description'}</p>
                                    </>
                                )}
                            </div>

                            {/* Task Meta Info */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Due Date</p>
                                        {isEditingTask && canEdit() ? (
                                            <input
                                                type="date"
                                                value={editedTask.due_date?.split('T')[0] || ''}
                                                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                                                className="text-sm font-medium text-gray-800 border rounded px-2 py-1"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-800">
                                                {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'Not set'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Assigned to</p>
                                        <p className="text-sm font-medium text-gray-800">{selectedTask.assigned_to_name || 'Unassigned'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {selectedTask.priority} priority
                                    </span>
                                </div>
                                {selectedTask.sheet_name && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                        <span className="text-xs text-green-700">From: {selectedTask.sheet_name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare className="w-5 h-5 text-gray-500" />
                                    <h4 className="font-semibold text-gray-800">Comments ({taskComments.length})</h4>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                                    {taskComments.length === 0 ? (
                                        <p className="text-gray-400 text-sm text-center py-4">No comments yet</p>
                                    ) : (
                                        taskComments.map((comment) => (
                                            <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs font-bold">
                                                        {comment.user_name?.charAt(0).toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm text-gray-800">{comment.user_name}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(comment.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{comment.comment}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Comment Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                        placeholder="Add a comment..."
                                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Actions */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
                            <div className="flex gap-2">
                                {canDelete() && (
                                    <button
                                        onClick={handleDeleteSelectedTask}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {canEdit() && (
                                    isEditingTask ? (
                                        <>
                                            <button
                                                onClick={() => setIsEditingTask(false)}
                                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateTask}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                            >
                                                Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingTask(true)}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit Task
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
