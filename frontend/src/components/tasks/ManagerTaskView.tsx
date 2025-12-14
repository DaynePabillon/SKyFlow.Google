"use client"

import { CheckSquare } from "lucide-react"

interface ManagerTaskViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function ManagerTaskView({ user, organization }: ManagerTaskViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Tasks</h1>
        <p className="text-gray-600 mt-1">Manage tasks in {organization.name}</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/40 shadow-lg">
        <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Task Management</h3>
        <p className="text-gray-600 mb-6">Kanban board and task management coming soon</p>
      </div>
    </div>
  )
}
