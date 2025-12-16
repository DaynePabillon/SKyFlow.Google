"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plane, Users, Clock, MapPin, AlertCircle, Plus, Search, Filter, ChevronDown, MoreHorizontal, UserPlus, Edit3, Trash2, ArrowRight, BarChart3 } from "lucide-react"
import ChartWidgetPicker from '@/components/widgets/ChartWidgetPicker'
import ChartWidget from '@/components/widgets/ChartWidget'

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

interface TeamMember {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
}

interface Widget {
    id: string
    widget_type: string
    title: string
}

interface FlightManifestProps {
    tasks: Task[]
    members: TeamMember[]
    onAssignMember?: (taskId: string, memberId: string | null) => void
    onStatusChange?: (taskId: string, status: Task['status']) => void
    onDeleteTask?: (taskId: string) => void
    onAddTask?: () => void
    organizationId?: string
}

export default function FlightManifest({
    tasks,
    members,
    onAssignMember,
    onStatusChange,
    onDeleteTask,
    onAddTask,
    organizationId
}: FlightManifestProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [selectedRow, setSelectedRow] = useState<string | null>(null)
    const [assignDropdownOpen, setAssignDropdownOpen] = useState<string | null>(null)
    const [actionsMenuOpen, setActionsMenuOpen] = useState<string | null>(null)
    const [widgets, setWidgets] = useState<Widget[]>([])
    const [showWidgetPicker, setShowWidgetPicker] = useState(false)

    // Fetch widgets on mount
    useEffect(() => {
        if (organizationId) {
            fetchWidgets()
        }
    }, [organizationId])

    const fetchWidgets = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(
                `http://localhost:3001/api/organizations/${organizationId}/widgets`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            )
            if (response.ok) {
                const data = await response.json()
                setWidgets(data.widgets || [])
            }
        } catch (error) {
            console.error('Error fetching widgets:', error)
        }
    }

    const handleAddWidget = async (widgetType: string, title: string) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(
                `http://localhost:3001/api/organizations/${organizationId}/widgets`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ widget_type: widgetType, title })
                }
            )
            if (response.ok) {
                fetchWidgets()
            }
        } catch (error) {
            console.error('Error adding widget:', error)
        }
    }

    const handleRemoveWidget = async (widgetId: string) => {
        try {
            const token = localStorage.getItem('token')
            await fetch(
                `http://localhost:3001/api/widgets/${widgetId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            )
            fetchWidgets()
        } catch (error) {
            console.error('Error removing widget:', error)
        }
    }

    // Close dropdowns when clicking outside - using capture phase
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            // Don't close if clicking inside a dropdown
            if (target.closest('[data-dropdown]')) return
            setAssignDropdownOpen(null)
            setActionsMenuOpen(null)
        }
        // Use setTimeout to allow the toggle to happen first
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Filter out archived tasks
    const activeTasks = useMemo(() =>
        tasks.filter(t => t.status !== 'archived'),
        [tasks]
    )

    // Apply filters
    const filteredTasks = useMemo(() => {
        return activeTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = filterStatus === 'all' || task.status === filterStatus
            return matchesSearch && matchesStatus
        })
    }, [activeTasks, searchQuery, filterStatus])

    const getFlightNumber = (id: string) => `SF-${id.slice(-4).toUpperCase()}`

    const getGate = (status: string) => {
        const gates: Record<string, string> = {
            'todo': 'A1',
            'in-progress': 'B2',
            'review': 'C3',
            'done': 'D4'
        }
        return gates[status] || 'A1'
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bgColor: string }> = {
            'todo': { label: 'BOARDING', color: 'text-gray-100', bgColor: 'bg-gray-600' },
            'in-progress': { label: 'DEPARTED', color: 'text-blue-100', bgColor: 'bg-blue-600' },
            'review': { label: 'LANDING', color: 'text-yellow-100', bgColor: 'bg-yellow-600' },
            'done': { label: 'ARRIVED', color: 'text-green-100', bgColor: 'bg-green-600' }
        }
        return configs[status] || configs['todo']
    }

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '--:--'
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    const isDelayed = (task: Task) => {
        if (!task.due_date || task.status === 'done') return false
        return new Date(task.due_date) < new Date()
    }

    const handleAssign = (taskId: string, memberId: string | null) => {
        onAssignMember?.(taskId, memberId)
        setAssignDropdownOpen(null)
    }

    const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
        onStatusChange?.(taskId, newStatus)
        setActionsMenuOpen(null)
    }

    const handleDelete = (taskId: string) => {
        if (confirm('Are you sure you want to delete this flight?')) {
            onDeleteTask?.(taskId)
        }
        setActionsMenuOpen(null)
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700">
            {/* Header - Airport Style */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Plane className="w-6 h-6 text-amber-400" />
                            <h2 className="text-xl font-bold text-white tracking-wide">DEPARTURES</h2>
                        </div>
                        <div className="text-sm text-slate-400">SkyFlow International</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search flights..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-48"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        >
                            <option value="all">All Flights</option>
                            <option value="todo">Boarding</option>
                            <option value="in-progress">Departed</option>
                            <option value="review">Landing</option>
                            <option value="done">Arrived</option>
                        </select>
                        <button
                            onClick={onAddTask}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New Flight
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800/50 border-b border-slate-700 text-sm font-semibold text-amber-400 tracking-wider">
                <div className="col-span-1">FLIGHT</div>
                <div className="col-span-4">DESTINATION</div>
                <div className="col-span-2">CREW</div>
                <div className="col-span-1 text-center">GATE</div>
                <div className="col-span-2 text-center">STATUS</div>
                <div className="col-span-1 text-center">TIME</div>
                <div className="col-span-1"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-700/50">
                {filteredTasks.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Plane className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No flights scheduled</p>
                        <button onClick={onAddTask} className="mt-4 text-amber-400 hover:text-amber-300 font-medium">
                            + Add your first flight
                        </button>
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const statusConfig = getStatusConfig(task.status)
                        const delayed = isDelayed(task)

                        return (
                            <div
                                key={task.id}
                                className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors
                  ${selectedRow === task.id ? 'bg-slate-700/50' : ''}
                  ${delayed ? 'bg-red-900/10' : ''}`}
                            >
                                {/* Flight Number */}
                                <div className="col-span-1 font-mono font-bold text-white">
                                    {getFlightNumber(task.id)}
                                </div>

                                {/* Destination */}
                                <div className="col-span-4">
                                    <div className="flex items-center gap-2">
                                        {delayed && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                                        <span className="text-white font-medium truncate">{task.title}</span>
                                    </div>
                                    {task.project_name && (
                                        <div className="text-xs text-slate-400 mt-0.5">{task.project_name}</div>
                                    )}
                                </div>

                                {/* Crew - with dropdown */}
                                <div className="col-span-2 relative">
                                    {task.assigned_to_name ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setAssignDropdownOpen(assignDropdownOpen === task.id ? null : task.id)
                                                setActionsMenuOpen(null)
                                            }}
                                            className="flex items-center gap-2 hover:bg-slate-600/50 rounded-lg px-2 py-1 transition-colors"
                                            data-dropdown
                                        >
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                                {task.assigned_to_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-slate-300 text-sm truncate">{task.assigned_to_name}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setAssignDropdownOpen(assignDropdownOpen === task.id ? null : task.id)
                                                setActionsMenuOpen(null)
                                            }}
                                            className="flex items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors text-sm"
                                            data-dropdown
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span>Assign</span>
                                        </button>
                                    )}

                                    {/* Assignment Dropdown */}
                                    {assignDropdownOpen === task.id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                                            data-dropdown
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() => handleAssign(task.id, null)}
                                                    className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-700 hover:text-white"
                                                >
                                                    Unassigned
                                                </button>
                                                {members.map((member) => (
                                                    <button
                                                        key={member.id}
                                                        onClick={() => handleAssign(task.id, member.id)}
                                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        {member.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Gate */}
                                <div className="col-span-1 text-center">
                                    <span className="inline-block px-2 py-1 bg-slate-700 rounded text-white font-mono font-bold text-sm">
                                        {getGate(task.status)}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="col-span-2 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider
                    ${statusConfig.bgColor} ${statusConfig.color}
                    ${delayed ? 'animate-pulse' : ''}`}>
                                        {delayed ? 'DELAYED' : statusConfig.label}
                                    </span>
                                </div>

                                {/* Time */}
                                <div className="col-span-1 text-center font-mono text-white">
                                    {formatTime(task.due_date)}
                                </div>

                                {/* Actions Menu */}
                                <div className="col-span-1 text-right relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setActionsMenuOpen(actionsMenuOpen === task.id ? null : task.id)
                                            setAssignDropdownOpen(null)
                                        }}
                                        className="p-1 text-slate-400 hover:text-white transition-colors"
                                        data-dropdown
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>

                                    {/* Actions Dropdown */}
                                    {actionsMenuOpen === task.id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                                            data-dropdown
                                        >
                                            <div className="py-1">
                                                <div className="px-3 py-2 text-xs text-slate-500 font-semibold uppercase">Change Status</div>
                                                {task.status !== 'todo' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, 'todo')}
                                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                                                        Boarding
                                                    </button>
                                                )}
                                                {task.status !== 'in-progress' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, 'in-progress')}
                                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                        Departed
                                                    </button>
                                                )}
                                                {task.status !== 'review' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, 'review')}
                                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                        Landing
                                                    </button>
                                                )}
                                                {task.status !== 'done' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, 'done')}
                                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        Arrived
                                                    </button>
                                                )}
                                                <div className="border-t border-slate-700 my-1" />
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Cancel Flight
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                    {filteredTasks.length} flight{filteredTasks.length !== 1 ? 's' : ''} scheduled
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-600" />
                        <span className="text-slate-400">Boarding</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                        <span className="text-slate-400">Departed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-600" />
                        <span className="text-slate-400">Landing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        <span className="text-slate-400">Arrived</span>
                    </div>
                </div>
            </div>

            {/* Chart Widgets Area - Aviation Theme */}
            {organizationId && (
                <div className="p-4 bg-slate-800/30 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            Flight Analytics
                        </h3>
                        <button
                            onClick={() => setShowWidgetPicker(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-300 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Widget
                        </button>
                    </div>

                    {widgets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {widgets.map(widget => (
                                <ChartWidget
                                    key={widget.id}
                                    type={widget.widget_type}
                                    title={widget.title}
                                    tasks={tasks}
                                    members={members}
                                    onRemove={() => handleRemoveWidget(widget.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No analytics widgets. Click "Add Widget" to visualize your flight data.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Widget Picker Modal */}
            <ChartWidgetPicker
                isOpen={showWidgetPicker}
                onClose={() => setShowWidgetPicker(false)}
                onSelectWidget={handleAddWidget}
            />
        </div>
    )
}
