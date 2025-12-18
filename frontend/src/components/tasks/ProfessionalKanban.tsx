"use client"

import { useRef, useState, useEffect } from 'react'
import { Plus, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import ProfessionalTaskCard from './ProfessionalTaskCard'

interface Task {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    project_name?: string
    assigned_to_name?: string
}

interface ProfessionalKanbanProps {
    tasks: Task[]
    onTaskClick?: (task: Task) => void
    onStatusChange?: (taskId: string, newStatus: string) => void
    onAddTask?: (status: string) => void
}

const columns = [
    { id: 'todo', label: 'To Do', color: 'bg-slate-400', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', headerBg: 'from-slate-500 to-slate-600' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500', bgColor: 'bg-blue-50/50', borderColor: 'border-blue-200', headerBg: 'from-blue-500 to-cyan-500' },
    { id: 'review', label: 'Review', color: 'bg-purple-500', bgColor: 'bg-purple-50/50', borderColor: 'border-purple-200', headerBg: 'from-purple-500 to-indigo-500' },
    { id: 'done', label: 'Done', color: 'bg-emerald-500', bgColor: 'bg-emerald-50/50', borderColor: 'border-emerald-200', headerBg: 'from-emerald-500 to-teal-500' }
]

export default function ProfessionalKanban({ tasks, onTaskClick, onStatusChange, onAddTask }: ProfessionalKanbanProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 340 // Column width + gap
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    const getTasksByStatus = (status: string) => {
        return tasks.filter(task => {
            const normalizedStatus = task.status.replace('-', '_')
            if (status === 'done') {
                return normalizedStatus === 'done' || normalizedStatus === 'completed'
            }
            return normalizedStatus === status
        })
    }

    return (
        <div className="relative">
            {/* Left Scroll Button */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center hover:bg-white transition-all border border-gray-200"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
            )}

            {/* Right Scroll Button */}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center hover:bg-white transition-all border border-gray-200"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            )}

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-5 overflow-x-auto pb-4 px-2 scroll-smooth"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#94a3b8 #e2e8f0'
                }}
            >
                {columns.map(column => {
                    const columnTasks = getTasksByStatus(column.id)

                    return (
                        <div
                            key={column.id}
                            className={`flex-shrink-0 w-80 ${column.bgColor} rounded-2xl p-4 border ${column.borderColor} shadow-sm`}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${column.color} shadow-sm`} />
                                    <h3 className="font-bold text-gray-800 text-sm tracking-wide">{column.label}</h3>
                                    <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full bg-gradient-to-r ${column.headerBg}`}>
                                        {columnTasks.length}
                                    </span>
                                </div>
                                <button className="p-1.5 hover:bg-white/80 rounded-lg transition-colors">
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Cards */}
                            <div className="space-y-3 min-h-[120px]">
                                {columnTasks.map(task => (
                                    <ProfessionalTaskCard
                                        key={task.id}
                                        task={task}
                                        onClick={() => onTaskClick?.(task)}
                                        onStatusChange={onStatusChange}
                                    />
                                ))}

                                {columnTasks.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm bg-white/50 rounded-xl border border-dashed border-gray-200">
                                        No tasks yet
                                    </div>
                                )}
                            </div>

                            {/* Add Task Button */}
                            <button
                                onClick={() => onAddTask?.(column.id)}
                                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 text-blue-600 hover:text-blue-700 bg-white/70 hover:bg-white border border-blue-200 hover:border-blue-300 rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow"
                            >
                                <Plus className="w-4 h-4" />
                                Add Task
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
