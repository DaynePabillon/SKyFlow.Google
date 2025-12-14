"use client"

import { CheckSquare, AlertCircle } from "lucide-react"

interface MemberTaskViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function MemberTaskView({ user, organization }: MemberTaskViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">My Tasks</h1>
            <p className="text-gray-600 mt-1">View your assigned tasks in {organization.name}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">View Only</span>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/40 shadow-lg">
        <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Tasks</h3>
        <p className="text-gray-600 mb-6">Task board coming soon - view and complete your assigned tasks</p>
      </div>
    </div>
  )
}
