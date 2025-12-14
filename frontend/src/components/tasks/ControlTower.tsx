"use client"

import { useState, useMemo } from "react"
import { Plane, AlertTriangle, Users, Clock, Target, Activity, ChevronDown, Zap } from "lucide-react"

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

interface ControlTowerProps {
    tasks: Task[]
    onTaskClick?: (task: Task) => void
}

export default function ControlTower({ tasks, onTaskClick }: ControlTowerProps) {
    const [hoveredTask, setHoveredTask] = useState<Task | null>(null)

    // No more React state for radar - using pure CSS animation now

    // Filter out archived tasks
    const activeTasks = useMemo(() =>
        tasks.filter(t => t.status !== 'archived'),
        [tasks]
    )

    // Calculate metrics
    const metrics = useMemo(() => {
        const now = new Date()
        const overdue = activeTasks.filter(t =>
            t.due_date && new Date(t.due_date) < now && t.status !== 'done'
        )
        const highPriority = activeTasks.filter(t => t.priority === 'high' && t.status !== 'done')
        const inFlight = activeTasks.filter(t => t.status === 'in-progress')
        const completed = activeTasks.filter(t => t.status === 'done')

        return { overdue, highPriority, inFlight, completed, total: activeTasks.length }
    }, [activeTasks])

    // Position tasks on radar based on status and priority
    const getTaskPosition = (task: Task, index: number, total: number) => {
        // Status determines distance from center (closer = almost done)
        const statusDistance: Record<string, number> = {
            'review': 12,       // Landing - closest to arrival
            'in-progress': 25,  // In Flight - middle
            'todo': 38,         // Boarding - outer ring
            'done': 45          // Arrived - edge
        }

        // Priority affects the angle quadrant
        const priorityOffset: Record<string, number> = {
            'high': 0,
            'medium': 120,
            'low': 240
        }

        const baseDistance = statusDistance[task.status] || 50
        // Add some randomization based on task ID for visual variety
        const seed = task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const angleOffset = (seed % 100) * 1.2

        const angle = (priorityOffset[task.priority] || 0) + angleOffset
        const radians = (angle * Math.PI) / 180

        const x = 50 + baseDistance * Math.cos(radians)
        const y = 50 + baseDistance * Math.sin(radians)

        return { x, y, angle }
    }

    // Get color based on priority and status
    const getTaskColor = (task: Task) => {
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

        if (isOverdue) return { fill: '#ef4444', pulse: true }
        if (task.priority === 'high') return { fill: '#f97316', pulse: false }
        if (task.priority === 'medium') return { fill: '#eab308', pulse: false }
        if (task.status === 'done') return { fill: '#22c55e', pulse: false }
        return { fill: '#3b82f6', pulse: false }
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 shadow-2xl border border-blue-500/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Control Tower</h2>
                        <p className="text-sm text-blue-300/70">Real-time flight overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span>LIVE</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Radar Display */}
                <div className="flex-1 relative">
                    <div className="aspect-square max-w-md mx-auto relative">
                        {/* Radar Background */}
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Grid circles */}
                            {[10, 20, 30, 40, 45].map((r, i) => (
                                <circle
                                    key={i}
                                    cx="50"
                                    cy="50"
                                    r={r}
                                    fill="none"
                                    stroke="rgba(59, 130, 246, 0.2)"
                                    strokeWidth="0.3"
                                />
                            ))}

                            {/* Grid lines */}
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                                const rad = (angle * Math.PI) / 180
                                return (
                                    <line
                                        key={i}
                                        x1="50"
                                        y1="50"
                                        x2={50 + 45 * Math.cos(rad)}
                                        y2={50 + 45 * Math.sin(rad)}
                                        stroke="rgba(59, 130, 246, 0.15)"
                                        strokeWidth="0.3"
                                    />
                                )
                            })}

                            {/* Radar sweep - pure CSS animation */}
                            <defs>
                                <linearGradient id="radarSweepGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                                    <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
                                    <stop offset="70%" stopColor="rgba(34, 211, 238, 0.4)" />
                                    <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                                </linearGradient>
                                <style>
                                    {`
                                        @keyframes radar-spin {
                                            from { transform: rotate(0deg); }
                                            to { transform: rotate(360deg); }
                                        }
                                        .radar-sweep-line {
                                            animation: radar-spin 4s linear infinite;
                                            transform-origin: 50px 50px;
                                        }
                                    `}
                                </style>
                            </defs>
                            <g className="radar-sweep-line">
                                <path
                                    d="M 50 50 L 95 50 A 45 45 0 0 1 82.5 82.5 Z"
                                    fill="url(#radarSweepGrad)"
                                    opacity="0.6"
                                />
                            </g>

                            {/* Center point */}
                            <circle cx="50" cy="50" r="3" fill="#22d3ee" className="animate-pulse" />
                            <circle cx="50" cy="50" r="1.5" fill="white" />

                            {/* Task dots */}
                            {activeTasks.filter(t => t.status !== 'done').map((task, i) => {
                                const pos = getTaskPosition(task, i, activeTasks.length)
                                const color = getTaskColor(task)
                                const isHovered = hoveredTask?.id === task.id

                                return (
                                    <g key={task.id}>
                                        {/* Pulse effect for overdue/priority - simple glow */}
                                        {color.pulse && (
                                            <circle
                                                cx={pos.x}
                                                cy={pos.y}
                                                r="5"
                                                fill={color.fill}
                                                opacity="0.3"
                                                className="animate-pulse"
                                            />
                                        )}
                                        {/* Task dot */}
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={isHovered ? 3 : 2}
                                            fill={color.fill}
                                            stroke="white"
                                            strokeWidth="0.5"
                                            className="cursor-pointer transition-all duration-200"
                                            onMouseEnter={() => setHoveredTask(task)}
                                            onMouseLeave={() => setHoveredTask(null)}
                                            onClick={() => onTaskClick?.(task)}
                                        />
                                        {/* Small plane icon for in-progress */}
                                        {task.status === 'in-progress' && (
                                            <text
                                                x={pos.x}
                                                y={pos.y - 4}
                                                fontSize="3"
                                                textAnchor="middle"
                                                fill="white"
                                            >
                                                ✈
                                            </text>
                                        )}
                                    </g>
                                )
                            })}
                        </svg>

                        {/* Hover tooltip */}
                        {hoveredTask && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-500/30 shadow-xl max-w-xs">
                                <div className="flex items-center gap-2 mb-1">
                                    <Plane className="w-4 h-4 text-blue-400" />
                                    <span className="text-white font-medium text-sm truncate">{hoveredTask.title}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className={`px-2 py-0.5 rounded ${hoveredTask.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                        hoveredTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-green-500/20 text-green-400'
                                        }`}>
                                        {hoveredTask.priority.toUpperCase()}
                                    </span>
                                    {hoveredTask.due_date && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(hoveredTask.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="absolute top-2 left-2 bg-slate-800/80 rounded-lg px-3 py-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span>High / Overdue</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span>Medium</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Low</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Panel */}
                <div className="lg:w-64 space-y-4">
                    {/* Overdue Alert */}
                    {metrics.overdue.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                                <span className="text-red-400 font-semibold">Turbulence Alert</span>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics.overdue.length}</div>
                            <div className="text-sm text-red-300/70">overdue flights</div>
                        </div>
                    )}

                    {/* In Flight */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Plane className="w-5 h-5 text-blue-400" />
                            <span className="text-blue-400 font-semibold">In Flight</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{metrics.inFlight.length}</div>
                        <div className="text-sm text-blue-300/70">active tasks</div>
                    </div>

                    {/* High Priority */}
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-orange-400" />
                            <span className="text-orange-400 font-semibold">First Class</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{metrics.highPriority.length}</div>
                        <div className="text-sm text-orange-300/70">high priority</div>
                    </div>

                    {/* Completed */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-semibold">Arrived</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{metrics.completed.length}</div>
                        <div className="text-sm text-green-300/70">completed</div>
                    </div>

                    {/* Total */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Total Flights</span>
                            <span className="text-2xl font-bold text-white">{metrics.total}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
