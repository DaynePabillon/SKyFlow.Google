"use client"

import { API_URL } from '@/lib/api/client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import ProfessionalKanban from "@/components/tasks/ProfessionalKanban"
import ChartWidget from "@/components/widgets/ChartWidget"
import ChartWidgetPicker from "@/components/widgets/ChartWidgetPicker"
import { FolderKanban, X, Plus, BarChart3, ChevronUp, ChevronDown, FileSpreadsheet, CheckSquare } from "lucide-react"

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
    synced?: boolean
    sheet_name?: string
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
                setSyncedSheets(data.sheets || [])
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
                        assigned_to_name: t.assigned_to_name || undefined
                    }))}
                    onStatusChange={handleStatusChange}
                    onAddTask={() => setIsCreateModalOpen(true)}
                    onDeleteTask={handleDeleteTask}
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
        </AppLayout>
    )
}
