"use client"

import { useState, ReactNode } from "react"
import { ChevronDown, ChevronRight, Plus, Cloud } from "lucide-react"

interface CloudGroupProps {
    title: string
    count: number
    status: 'healthy' | 'at-risk' | 'overdue' | 'neutral'
    children: ReactNode
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    onAddTask?: () => void
    isExpanded?: boolean
}

export default function CloudGroup({
    title,
    count,
    status,
    children,
    onDragOver,
    onDrop,
    onAddTask,
    isExpanded: initialExpanded = true
}: CloudGroupProps) {
    const [isExpanded, setIsExpanded] = useState(initialExpanded)
    const [isDraggedOver, setIsDraggedOver] = useState(false)

    const getStatusConfig = (status: string) => {
        const config = {
            healthy: {
                bgGradient: 'from-emerald-100/80 via-green-50/60 to-cyan-100/80',
                borderColor: 'border-green-300/50',
                glowColor: 'shadow-green-200/50',
                iconColor: 'text-green-600',
                headerBg: 'bg-gradient-to-r from-green-500 to-emerald-500'
            },
            'at-risk': {
                bgGradient: 'from-amber-100/80 via-yellow-50/60 to-orange-100/80',
                borderColor: 'border-yellow-300/50',
                glowColor: 'shadow-yellow-200/50',
                iconColor: 'text-yellow-600',
                headerBg: 'bg-gradient-to-r from-yellow-500 to-amber-500'
            },
            overdue: {
                bgGradient: 'from-red-100/80 via-rose-50/60 to-orange-100/80',
                borderColor: 'border-red-300/50',
                glowColor: 'shadow-red-200/50',
                iconColor: 'text-red-600',
                headerBg: 'bg-gradient-to-r from-red-500 to-rose-500'
            },
            neutral: {
                bgGradient: 'from-blue-100/80 via-sky-50/60 to-cyan-100/80',
                borderColor: 'border-blue-300/50',
                glowColor: 'shadow-blue-200/50',
                iconColor: 'text-blue-600',
                headerBg: 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }
        }
        return config[status as keyof typeof config] || config.neutral
    }

    const statusConfig = getStatusConfig(status)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggedOver(true)
        onDragOver(e)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        // Only set isDraggedOver to false if we're actually leaving the container
        // not just moving to a child element
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY

        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDraggedOver(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggedOver(false)
        onDrop(e)
    }

    return (
        <div
            className={`
        relative transition-all duration-500 ease-out
        ${isDraggedOver ? 'scale-[1.02]' : 'scale-100'}
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Cloud Background SVG */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <svg
                    viewBox="0 0 400 300"
                    className={`
            w-full h-full opacity-30 transition-opacity duration-300
            ${isDraggedOver ? 'opacity-50' : 'opacity-30'}
          `}
                    preserveAspectRatio="none"
                >
                    <defs>
                        <filter id={`cloud-blur-${title}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                        </filter>
                    </defs>
                    {/* Animated cloud shapes */}
                    <ellipse
                        cx="100"
                        cy="150"
                        rx="80"
                        ry="50"
                        fill="white"
                        filter={`url(#cloud-blur-${title})`}
                        className="animate-pulse"
                        style={{ animationDuration: '4s' }}
                    />
                    <ellipse
                        cx="200"
                        cy="120"
                        rx="100"
                        ry="60"
                        fill="white"
                        filter={`url(#cloud-blur-${title})`}
                        className="animate-pulse"
                        style={{ animationDuration: '5s', animationDelay: '1s' }}
                    />
                    <ellipse
                        cx="300"
                        cy="160"
                        rx="70"
                        ry="45"
                        fill="white"
                        filter={`url(#cloud-blur-${title})`}
                        className="animate-pulse"
                        style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}
                    />
                </svg>
            </div>

            {/* Main Container */}
            <div
                className={`
          relative rounded-2xl overflow-hidden
          bg-gradient-to-br ${statusConfig.bgGradient}
          border-2 ${statusConfig.borderColor}
          backdrop-blur-xl
          shadow-lg ${statusConfig.glowColor}
          transition-all duration-300
          ${isDraggedOver ? 'ring-4 ring-blue-400/50 shadow-xl' : ''}
        `}
            >
                {/* Header */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
            flex items-center justify-between px-4 py-3 cursor-pointer
            ${statusConfig.headerBg}
            transition-all duration-200 hover:brightness-110
          `}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Cloud className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm tracking-wide">{title}</h3>
                            <span className="text-[10px] text-white/70 font-medium">
                                {count} {count === 1 ? 'flight' : 'flights'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onAddTask && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onAddTask()
                                }}
                                className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                            >
                                <Plus className="w-4 h-4 text-white" />
                            </button>
                        )}
                        <div className="p-1">
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-white" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-white" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div
                    className={`
            overflow-hidden transition-all duration-500 ease-out
            ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          `}
                >
                    <div className="p-4 space-y-3 min-h-[100px]">
                        {count === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Cloud className={`w-12 h-12 ${statusConfig.iconColor} opacity-40 mb-2`} />
                                <p className="text-sm text-gray-500">Clear skies ahead</p>
                                <p className="text-xs text-gray-400">Drop tasks here to add them</p>
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                </div>

                {/* Drop Zone Indicator */}
                {isDraggedOver && (
                    <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-2xl flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
                            <span className="text-blue-600 font-medium text-sm">Drop to land here ✈️</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
