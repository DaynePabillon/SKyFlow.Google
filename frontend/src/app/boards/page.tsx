"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import ProjectBoardView from "@/components/boards/ProjectBoardView"
import { FolderKanban, X, Plus } from "lucide-react"

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

interface Project {
    id: string
    name: string
    description?: string
    status: string
    task_count?: number
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

export default function BoardsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [members, setMembers] = useState<TeamMember[]>([])
    const [mounted, setMounted] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
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

        if (storedUser) setUser(JSON.parse(storedUser))
        if (storedOrgs) setOrganizations(JSON.parse(storedOrgs))
        if (storedSelectedOrg) {
            const org = JSON.parse(storedSelectedOrg)
            setSelectedOrg(org)
            fetchData(org.id)
        }

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
            fetchProjects(orgId),
            fetchMembers(orgId)
        ])
    }

    const fetchTasks = async (orgId: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`http://localhost:3001/api/organizations/${orgId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                const normalizedTasks = (data.tasks || []).map((task: Task) => ({
                    ...task,
                    status: normalizeStatus(task.status)
                }))
                setTasks(normalizedTasks)
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

    const fetchProjects = async (orgId: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`http://localhost:3001/api/organizations/${orgId}/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setProjects(data.projects || [])
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        }
    }

    const fetchMembers = async (orgId: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`http://localhost:3001/api/organizations/${orgId}/members`, {
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
            let response

            if (selectedProjectId) {
                // Create task in specific project using /api/tasks
                response = await fetch(`http://localhost:3001/api/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        project_id: selectedProjectId,
                        title: newTask.title,
                        description: newTask.description,
                        status: 'todo',
                        priority: newTask.priority,
                        due_date: newTask.due_date || null,
                        assigned_to: newTask.assigned_to || null
                    })
                })
            } else {
                // Create task without project - uses organization endpoint that auto-creates "General Tasks" project
                response = await fetch(`http://localhost:3001/api/organizations/${selectedOrg.id}/tasks`, {
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
            }

            if (response.ok) {
                fetchData(selectedOrg.id)
                setIsCreateModalOpen(false)
                setSelectedProjectId(null)
                setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' })
            } else {
                const error = await response.json()
                console.error('Failed to create task:', error)
                alert(error.error || 'Failed to create task')
            }
        } catch (error) {
            console.error('Error creating task:', error)
        }
    }

    const handleAssignMember = async (taskId: string, memberId: string | null) => {
        try {
            const token = localStorage.getItem('token')
            await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ assigned_to: memberId })
            })
            if (selectedOrg) fetchTasks(selectedOrg.id)
        } catch (error) {
            console.error('Error assigning member:', error)
        }
    }

    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        try {
            const token = localStorage.getItem('token')
            await fetch(`http://localhost:3001/api/tasks/${taskId}/status`, {
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
            await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (selectedOrg) fetchTasks(selectedOrg.id)
        } catch (error) {
            console.error('Error deleting task:', error)
        }
    }

    const handleAddTask = (projectId: string) => {
        setSelectedProjectId(projectId)
        setIsCreateModalOpen(true)
    }

    const handleOrgChange = (org: Organization) => {
        setSelectedOrg(org)
        localStorage.setItem('selectedOrganization', JSON.stringify(org))
        fetchData(org.id)
    }

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
                <div className="mb-8">
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
                                    Tasks organized by project in {selectedOrg.name}
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

                {/* Project Board View */}
                <ProjectBoardView
                    tasks={tasks}
                    projects={projects}
                    members={members}
                    onAssignMember={handleAssignMember}
                    onStatusChange={handleStatusChange}
                    onDeleteTask={handleDeleteTask}
                    onAddTask={handleAddTask}
                    userRole={selectedOrg.role}
                />
            </div>

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                {selectedProjectId
                                    ? `Add Task to ${projects.find(p => p.id === selectedProjectId)?.name || 'Project'}`
                                    : 'Create New Task'
                                }
                            </h3>
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setSelectedProjectId(null)
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {!selectedProjectId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                    <select
                                        value={selectedProjectId || ''}
                                        onChange={(e) => setSelectedProjectId(e.target.value || null)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="">General Tasks</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

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
                                onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setSelectedProjectId(null)
                                }}
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
