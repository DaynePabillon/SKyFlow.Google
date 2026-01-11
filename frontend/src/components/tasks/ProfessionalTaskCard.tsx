"use client"
import { useState } from 'react'

import { Clock, CheckCircle2, AlertCircle, User, Calendar, Flag, Trash2, Archive } from 'lucide-react'

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

interface ProfessionalTaskCardProps {
    task: Task
    onClick?: () => void
    onStatusChange?: (taskId: string, status: string) => void
    onDelete?: (taskId: string) => void
    onArchive?: (taskId: string) => void
}

export default function ProfessionalTaskCard({ task, onClick, onStatusChange, onDelete, onArchive }: ProfessionalTaskCardProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200'
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'low': return 'bg-green-100 text-green-700 border-green-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done':
            case 'completed': return 'bg-green-500'
            case 'in_progress':
            case 'in-progress': return 'bg-blue-500'
            case 'review': return 'bg-purple-500'
            case 'blocked': return 'bg-red-500'
            default: return 'bg-gray-400'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'todo': return 'To Do'
            case 'in_progress':
            case 'in-progress': return 'In Progress'
            case 'review': return 'Review'
            case 'done':
            case 'completed': return 'Done'
            case 'blocked': return 'Blocked'
            default: return status
        }
    }

    const formatDate = (date: string) => {
        const d = new Date(date)
        const now = new Date()
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true }
        if (diffDays === 0) return { text: 'Due today', isOverdue: false }
        if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false }
        return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false }
    }

    const dueInfo = task.due_date ? formatDate(task.due_date) : null

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group relative"
        >
            {/* Quick Actions (Hover) */}
            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {onArchive && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
                        className="p-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md transition-all"
                        title="Archive"
                    >
                        <Archive className="w-3.5 h-3.5 text-white" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg shadow-md transition-all"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                )}
            </div>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-medium text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {task.title}
                </h3>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getStatusColor(task.status)}`} />
            </div>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Priority badge */}
                <span className={`px-2 py-0.5 rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>

                {/* Status label */}
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {getStatusLabel(task.status)}
                </span>

                {/* Due date */}
                {dueInfo && (
                    <span className={`flex items-center gap-1 ${dueInfo.isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3" />
                        {dueInfo.text}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                {/* Project */}
                {task.project_name && (
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">{task.project_name}</span>
                )}

                {/* Assignee */}
                {task.assigned_to_name ? (
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {task.assigned_to_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-500 hidden sm:inline">{task.assigned_to_name.split(' ')[0]}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                        <User className="w-4 h-4" />
                        <span className="text-xs">Unassigned</span>
                    </div>
                )}
            </div>
        </div>
    )
}
