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
        <h1 className="text-3xl font-bold text-blue-fantastic">Tasks</h1>
        <p className="text-truffle-trouble mt-1">Manage tasks in {organization.name}</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 text-center border border-oatmeal">
        <CheckSquare className="w-16 h-16 text-truffle-trouble mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-blue-fantastic mb-2">Task Management</h3>
        <p className="text-truffle-trouble mb-6">Kanban board and task management coming soon</p>
      </div>
    </div>
  )
}
