"use client"

import { CheckCircle2, Clock, AlertCircle, TrendingUp, Users, FolderKanban, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Task {
    id: string
    status: string
    priority: string
    due_date?: string
}

interface Project {
    id: string
    name: string
    status: string
}

interface ProfessionalDashboardProps {
    tasks: Task[]
    projects: Project[]
    organizationName?: string
    userName?: string
}

export default function ProfessionalDashboard({ tasks, projects, organizationName, userName }: ProfessionalDashboardProps) {
    // Calculate metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length
    const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.status === 'done' || t.status === 'completed') return false
        return new Date(t.due_date) < new Date()
    }).length

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const activeProjects = projects.filter(p => p.status === 'active').length

    const metrics = [
        {
            label: 'Tasks Completed',
            value: completedTasks,
            total: totalTasks,
            icon: CheckCircle2,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700',
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'In Progress',
            value: inProgressTasks,
            icon: Clock,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            trend: '+5%',
            trendUp: true
        },
        {
            label: 'Overdue',
            value: overdueTasks,
            icon: AlertCircle,
            color: 'bg-red-500',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            trend: '-3%',
            trendUp: false
        },
        {
            label: 'Active Projects',
            value: activeProjects,
            total: projects.length,
            icon: FolderKanban,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
        }
    ]

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}!
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Here's what's happening with your projects today.
                        </p>
                    </div>
                    {organizationName && (
                        <div className="px-4 py-2 bg-gray-100 rounded-lg">
                            <span className="text-sm text-gray-600">{organizationName}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <div key={index} className={`${metric.bgColor} rounded-xl p-5 border border-gray-100`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 ${metric.color} rounded-lg`}>
                                <metric.icon className="w-5 h-5 text-white" />
                            </div>
                            {metric.trend && (
                                <span className={`flex items-center text-xs font-medium ${metric.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                    {metric.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {metric.trend}
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900">
                                {metric.value}
                                {metric.total !== undefined && (
                                    <span className="text-sm font-normal text-gray-500">/{metric.total}</span>
                                )}
                            </p>
                            <p className={`text-sm ${metric.textColor}`}>{metric.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completion Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
                    <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>{completedTasks} completed</span>
                    <span>{totalTasks - completedTasks} remaining</span>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-700">Productivity</h3>
                    </div>
                    <p className="text-sm text-gray-500">Track your daily task completion rate</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-700">Team Activity</h3>
                    </div>
                    <p className="text-sm text-gray-500">See what your team is working on</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <FolderKanban className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-700">Project Status</h3>
                    </div>
                    <p className="text-sm text-gray-500">Overview of all active projects</p>
                </div>
            </div>
        </div>
    )
}
