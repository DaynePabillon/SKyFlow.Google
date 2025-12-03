"use client"

import { Calendar, CheckCircle2, Clock, BookOpen } from "lucide-react"
import TaskCard from "@/components/shared/task-card"
import ScheduleWidget from "@/components/shared/schedule-widget"
import PerformanceChart from "@/components/shared/performance-chart"
import AttendanceCard from "@/components/shared/attendance-card"

interface StudentDashboardProps {
  userName: string
}

export default function StudentDashboard({ userName }: StudentDashboardProps) {
  const upcomingTasks = [
    {
      id: "1",
      title: "Mathematics Assignment - Chapter 5",
      class: "Advanced Calculus",
      dueDate: "2025-12-05",
      status: "pending",
      progress: 45,
    },
    {
      id: "2",
      title: "Physics Lab Report",
      class: "Experimental Physics",
      dueDate: "2025-12-08",
      status: "in-progress",
      progress: 75,
    },
    {
      id: "3",
      title: "English Essay - Shakespeare Analysis",
      class: "Literature 101",
      dueDate: "2025-12-10",
      status: "not-started",
      progress: 0,
    },
  ]

  const schedule = [
    { time: "09:00", subject: "Mathematics", instructor: "Dr. Smith", room: "Lab 201" },
    { time: "11:00", subject: "Physics", instructor: "Prof. Johnson", room: "Hall A" },
    { time: "13:00", subject: "Literature", instructor: "Ms. Brown", room: "Room 305" },
  ]

  const performanceData = [
    { subject: "Mathematics", score: 88 },
    { subject: "Physics", score: 92 },
    { subject: "Literature", score: 85 },
    { subject: "History", score: 90 },
  ]

  return (
    <div className="space-y-8 p-6 bg-gray-50">
      {/* Welcome Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-2xl p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {userName}! 👋</h1>
          <p className="text-white/90 text-lg">Here's what's happening in your classes today.</p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Key Metrics with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Active Tasks</p>
            <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-orange-900 dark:text-orange-100">3</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">Due this week</p>
        </div>
        
        <div className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Completed</p>
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-green-900 dark:text-green-100">12</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">This semester</p>
        </div>
        
        <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Attendance</p>
            <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">94%</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">47 of 50 days</p>
        </div>
        
        <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Avg. Grade</p>
            <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">89%</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Excellent work!</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Upcoming Tasks</h2>
          {upcomingTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendance */}
          <AttendanceCard attendance={94} daysPresent={47} totalDays={50} />

          {/* Performance Overview */}
          <PerformanceChart data={performanceData} />
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Today's Schedule</h2>
        <ScheduleWidget schedule={schedule} />
      </div>
    </div>
  )
}
