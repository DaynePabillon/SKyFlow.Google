"use client"

import { useState, useRef, useMemo } from "react"
import { Plane, GripVertical, Trash2, Archive, X } from "lucide-react"

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

interface BoardingPassCardProps {
    task: Task
    onDragStart: (e: React.DragEvent, taskId: string) => void
    onDelete?: (taskId: string) => void
    onArchive?: (taskId: string) => void
    onClick?: () => void
}

export default function BoardingPassCard({ task, onDragStart, onDelete, onArchive, onClick }: BoardingPassCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [swipeOffset, setSwipeOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [showActions, setShowActions] = useState(false)
    const startX = useRef(0)
    const cardRef = useRef<HTMLDivElement>(null)

    const getPriorityConfig = (priority: string) => {
        const config = {
            low: {
                label: 'ECONOMY',
                dots: 1,
                color: 'text-green-600',
                bgGradient: 'from-green-50 to-emerald-50',
                accentColor: 'bg-green-500'
            },
            medium: {
                label: 'BUSINESS',
                dots: 2,
                color: 'text-yellow-600',
                bgGradient: 'from-yellow-50 to-amber-50',
                accentColor: 'bg-yellow-500'
            },
            high: {
                label: 'FIRST CLASS',
                dots: 3,
                color: 'text-red-600',
                bgGradient: 'from-red-50 to-orange-50',
                accentColor: 'bg-red-500'
            }
        }
        return config[priority as keyof typeof config] || config.medium
    }

    const getStatusConfig = (status: string) => {
        const config = {
            'todo': { label: 'BOARDING', gate: 'A1', color: 'text-gray-600' },
            'in-progress': { label: 'IN FLIGHT', gate: 'B2', color: 'text-blue-600' },
            'review': { label: 'LANDING', gate: 'C3', color: 'text-yellow-600' },
            'done': { label: 'ARRIVED', gate: 'D4', color: 'text-green-600' }
        }
        return config[status as keyof typeof config] || config['todo']
    }

    const priorityConfig = getPriorityConfig(task.priority)
    const statusConfig = getStatusConfig(task.status)

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '---'
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getFlightNumber = (id: string) => {
        return `SF-${id.slice(-4).toUpperCase()}`
    }

    // Touch/swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX
        setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        const currentX = e.touches[0].clientX
        const diff = startX.current - currentX
        // Only allow left swipe (positive diff)
        if (diff > 0) {
            setSwipeOffset(Math.min(diff, 120))
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        if (swipeOffset > 60) {
            setShowActions(true)
            setSwipeOffset(120)
        } else {
            setSwipeOffset(0)
            setShowActions(false)
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDelete) {
            onDelete(task.id)
        }
    }

    const handleArchive = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onArchive) {
            onArchive(task.id)
        }
    }

    const resetSwipe = () => {
        setSwipeOffset(0)
        setShowActions(false)
    }

    // Generate barcode-style lines - memoized to prevent regeneration on each render
    // Use a simple hash of task ID to seed the pattern
    const barcodeLines = useMemo(() => {
        const seed = task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return Array.from({ length: 30 }, (_, i) => ({
            width: ((seed + i) % 3) > 0 ? 2 : 1,
            height: 12 + ((seed * (i + 1)) % 8)
        }))
    }, [task.id])

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Action buttons revealed on swipe */}
            <div className="absolute right-0 top-0 bottom-0 flex items-stretch z-0">
                <button
                    onClick={handleArchive}
                    className="w-14 bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center hover:from-yellow-600 hover:to-amber-600 transition-colors"
                >
                    <Archive className="w-5 h-5 text-white" />
                </button>
                <button
                    onClick={handleDelete}
                    className="w-14 bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center hover:from-red-600 hover:to-rose-600 transition-colors"
                >
                    <Trash2 className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Main Card - slides left to reveal actions */}
            <div
                ref={cardRef}
                draggable={!showActions}
                onDragStart={(e) => !showActions && onDragStart(e, task.id)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={showActions ? resetSwipe : onClick}
                style={{ transform: `translateX(-${swipeOffset}px)` }}
                className={`
          relative cursor-grab active:cursor-grabbing z-10
          transition-all duration-300 ease-out
          ${isHovered && !showActions ? 'scale-[1.02] -rotate-1' : 'scale-100 rotate-0'}
        `}
            >
                {/* Boarding Pass Container */}
                <div className={`
          relative overflow-hidden rounded-xl
          bg-gradient-to-br ${priorityConfig.bgGradient}
          border border-white/60 shadow-lg
          hover:shadow-xl transition-shadow duration-300
        `}>
                    {/* Hover Action Buttons */}
                    {isHovered && !showActions && (
                        <div className="absolute top-2 right-2 z-20 flex gap-1">
                            <button
                                onClick={handleArchive}
                                className="p-1.5 bg-yellow-500 hover:bg-yellow-600 rounded-lg shadow-md transition-all"
                                title="Archive"
                            >
                                <Archive className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg shadow-md transition-all"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>
                    )}

                    {/* Perforated Edge Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 flex flex-col justify-around py-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-white/80" />
                        ))}
                    </div>

                    {/* Header Section */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600">
                        <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4 text-white" />
                            <span className="text-xs font-bold text-white tracking-wider">
                                {task.project_name || 'SKYFLOW'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-white/80">
                                {getFlightNumber(task.id)}
                            </span>
                            <GripVertical className="w-4 h-4 text-white/60" />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="px-4 py-3">
                        {/* Route Display */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-center">
                                <div className={`text-[10px] font-medium ${statusConfig.color} tracking-wider`}>
                                    FROM
                                </div>
                                <div className="w-3 h-3 rounded-full border-2 border-gray-400 mx-auto my-1" />
                                <div className="text-[10px] font-bold text-gray-700">TODO</div>
                            </div>

                            {/* Flight Path Line */}
                            <div className="flex-1 mx-3 relative">
                                <div className="border-t-2 border-dashed border-gray-300" />
                                <Plane className="w-4 h-4 text-blue-500 absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 rotate-90" />
                            </div>

                            <div className="text-center">
                                <div className={`text-[10px] font-medium ${statusConfig.color} tracking-wider`}>
                                    TO
                                </div>
                                <div className={`w-3 h-3 rounded-full mx-auto my-1 ${task.status === 'done' ? 'bg-green-500' : 'border-2 border-gray-400'}`} />
                                <div className="text-[10px] font-bold text-gray-700">DONE</div>
                            </div>
                        </div>

                        {/* Task Title */}
                        <h3 className="font-semibold text-gray-800 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
                            {task.title}
                        </h3>

                        {/* Details Grid */}
                        <div className="grid grid-cols-4 gap-2 text-center border-t border-dashed border-gray-300 pt-3">
                            <div>
                                <div className="text-[9px] text-gray-500 font-medium">GATE</div>
                                <div className="text-xs font-bold text-gray-700">{statusConfig.gate}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-gray-500 font-medium">DEPART</div>
                                <div className="text-xs font-bold text-gray-700">{formatDate(task.created_at)}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-gray-500 font-medium">ARRIVE</div>
                                <div className="text-xs font-bold text-gray-700">{formatDate(task.due_date)}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-gray-500 font-medium">SEAT</div>
                                <div className="text-xs font-bold text-gray-700">
                                    {task.assigned_to_name?.slice(0, 3).toUpperCase() || '---'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer with Barcode */}
                    <div className="px-4 py-2 bg-white/50 border-t border-dashed border-gray-300 flex items-center justify-between">
                        {/* Barcode */}
                        <div className="flex items-end gap-[1px]">
                            {barcodeLines.map((line, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-700"
                                    style={{ width: line.width, height: line.height }}
                                />
                            ))}
                        </div>

                        {/* Priority Badge */}
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${priorityConfig.color}`}>
                                {priorityConfig.label}
                            </span>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full ${i < priorityConfig.dots ? priorityConfig.accentColor : 'bg-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Status Indicator Strip */}
                    <div className={`h-1 ${priorityConfig.accentColor}`} />
                </div>
            </div>
        </div>
    )
}
