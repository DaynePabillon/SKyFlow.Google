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
    <div className="space-y-8 p-6 bg-palladian">
      {/* Welcome Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-fantastic via-abyssal-anchorfish to-truffle-trouble rounded-2xl p-8 shadow-xl">
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
        <div className="group bg-gradient-to-br from-burning-flame/20 to-burning-flame/30 rounded-2xl p-6 border border-burning-flame/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-truffle-trouble uppercase tracking-wide">Active Tasks</p>
            <div className="p-2 bg-burning-flame/30 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-truffle-trouble" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">3</p>
          <p className="text-xs text-truffle-trouble mt-2">Due this week</p>
        </div>
        
        <div className="group bg-gradient-to-br from-oatmeal/40 to-oatmeal/60 rounded-2xl p-6 border border-oatmeal shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-truffle-trouble uppercase tracking-wide">Completed</p>
            <div className="p-2 bg-oatmeal rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-blue-fantastic" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">12</p>
          <p className="text-xs text-truffle-trouble mt-2">This semester</p>
        </div>
        
        <div className="group bg-gradient-to-br from-blue-fantastic/20 to-blue-fantastic/30 rounded-2xl p-6 border border-blue-fantastic/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-fantastic uppercase tracking-wide">Attendance</p>
            <div className="p-2 bg-blue-fantastic/20 rounded-lg group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-blue-fantastic" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">94%</p>
          <p className="text-xs text-truffle-trouble mt-2">47 of 50 days</p>
        </div>
        
        <div className="group bg-gradient-to-br from-truffle-trouble/20 to-truffle-trouble/30 rounded-2xl p-6 border border-truffle-trouble/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-truffle-trouble uppercase tracking-wide">Avg. Grade</p>
            <div className="p-2 bg-truffle-trouble/20 rounded-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-truffle-trouble" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">89%</p>
          <p className="text-xs text-truffle-trouble mt-2">Excellent work!</p>
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
