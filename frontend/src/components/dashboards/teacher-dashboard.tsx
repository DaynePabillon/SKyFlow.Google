"use client"

import { BarChart3, Users, BookOpen, TrendingUp } from "lucide-react"
import ClassCard from "@/components/shared/class-card"
import AnalyticsWidget from "@/components/shared/analytics-widget"

interface TeacherDashboardProps {
  userName: string
}

export default function TeacherDashboard({ userName }: TeacherDashboardProps) {
  const classes = [
    {
      id: "1",
      name: "Advanced Calculus",
      code: "MATH401",
      students: 32,
      avgGrade: 87,
      nextClass: "2025-12-05 at 09:00",
    },
    {
      id: "2",
      name: "Physics Lab",
      code: "PHYS301",
      students: 28,
      avgGrade: 91,
      nextClass: "2025-12-06 at 11:00",
    },
    {
      id: "3",
      name: "Introduction to Programming",
      code: "CS101",
      students: 45,
      avgGrade: 84,
      nextClass: "2025-12-07 at 14:00",
    },
  ]

  const recentSubmissions = [
    { studentName: "Emma Wilson", assignment: "Calculus Problem Set 5", time: "2 hours ago", status: "graded" },
    { studentName: "James Lee", assignment: "Lab Report - Experiment 3", time: "4 hours ago", status: "pending" },
    { studentName: "Sarah Johnson", assignment: "Programming Assignment 4", time: "1 day ago", status: "submitted" },
  ]

  const classAnalytics = [
    { name: "Advanced Calculus", data: [65, 72, 78, 81, 85, 87, 88, 87] },
    { name: "Physics Lab", data: [78, 82, 85, 88, 90, 91, 92, 91] },
    { name: "Programming", data: [70, 75, 78, 80, 82, 84, 85, 84] },
  ]

  return (
    <div className="space-y-8 p-6 bg-palladian">
      {/* Welcome Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-fantastic via-abyssal-anchorfish to-truffle-trouble rounded-2xl p-8 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome, {userName}! 🎓</h1>
          <p className="text-white/90 text-lg">Manage your classes and track student progress.</p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Key Metrics with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-blue-fantastic/20 to-blue-fantastic/30 rounded-2xl p-6 border border-blue-fantastic/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-fantastic uppercase tracking-wide">Total Students</p>
            <div className="p-2 bg-blue-fantastic/20 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-blue-fantastic" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">105</p>
          <p className="text-xs text-truffle-trouble mt-2">Across all classes</p>
        </div>
        
        <div className="group bg-gradient-to-br from-oatmeal/40 to-oatmeal/60 rounded-2xl p-6 border border-oatmeal shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-truffle-trouble uppercase tracking-wide">Active Classes</p>
            <div className="p-2 bg-oatmeal rounded-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-blue-fantastic" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">3</p>
          <p className="text-xs text-truffle-trouble mt-2">This semester</p>
        </div>
        
        <div className="group bg-gradient-to-br from-truffle-trouble/20 to-truffle-trouble/30 rounded-2xl p-6 border border-truffle-trouble/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-truffle-trouble uppercase tracking-wide">Avg Performance</p>
            <div className="p-2 bg-truffle-trouble/20 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-truffle-trouble" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">87%</p>
          <p className="text-xs text-truffle-trouble mt-2">Great progress!</p>
        </div>
        
        <div className="group bg-gradient-to-br from-burning-flame/20 to-burning-flame/30 rounded-2xl p-6 border border-burning-flame/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-truffle-trouble uppercase tracking-wide">Pending Reviews</p>
            <div className="p-2 bg-burning-flame/30 rounded-lg group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-truffle-trouble" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-fantastic">8</p>
          <p className="text-xs text-truffle-trouble mt-2">Needs attention</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes Overview */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Your Classes</h2>
          {classes.map((cls) => (
            <ClassCard key={cls.id} classInfo={cls} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Submissions */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="font-bold text-foreground mb-4">Recent Submissions</h3>
            <div className="space-y-3">
              {recentSubmissions.map((sub, idx) => (
                <div key={idx} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{sub.studentName}</p>
                  <p className="text-xs text-muted-foreground">{sub.assignment}</p>
                  <p className="text-xs text-accent mt-1">{sub.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <AnalyticsWidget data={classAnalytics} />
    </div>
  )
}
