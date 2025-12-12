"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Plus, Clock, Users, ArrowLeft, ChevronLeft, ChevronRight, X, BookOpen, FileText, FolderOpen, BarChart3, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  attendees?: Array<{ email: string }>
  colorId?: string
}

interface NewEvent {
  title: string
  description: string
  startTime: string
  endTime: string
  allDay: boolean
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    allDay: false,
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch("http://localhost:3001/api/calendar/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch events")

      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start.dateTime || event.start.date || "")
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.start.dateTime || event.start.date || "")
    const end = new Date(event.end.dateTime || event.end.date || "")
    
    if (event.start.date) {
      return "All day"
    }
    
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    
    return `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} • ${hours > 0 ? `${hours} hour` : ""}${minutes > 0 ? ` ${minutes} min` : ""}`
  }

  const formatEventDate = (event: CalendarEvent) => {
    const date = new Date(event.start.dateTime || event.start.date || "")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getEventColor = (index: number) => {
    const colors = [
      { border: "border-l-blue-500", bg: "bg-blue-50" },
      { border: "border-l-purple-500", bg: "bg-purple-50" },
      { border: "border-l-orange-500", bg: "bg-orange-50" },
      { border: "border-l-pink-500", bg: "bg-pink-50" },
    ]
    return colors[index % colors.length]
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(date)
    setShowEventModal(true)
    setNewEvent({
      ...newEvent,
      startTime: date.toISOString().slice(0, 16),
      endTime: new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    })
  }

  const handleCreateEvent = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("http://localhost:3001/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startTime: new Date(newEvent.startTime),
          endTime: new Date(newEvent.endTime),
          allDay: newEvent.allDay,
        }),
      })

      if (response.ok) {
        setShowEventModal(false)
        setNewEvent({ title: "", description: "", startTime: "", endTime: "", allDay: false })
        fetchEvents()
      }
    } catch (err) {
      console.error("Failed to create event:", err)
    }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const upcomingEvents = events
    .filter((e) => new Date(e.start.dateTime || e.start.date || "") >= new Date())
    .sort((a, b) => new Date(a.start.dateTime || a.start.date || "").getTime() - new Date(b.start.dateTime || b.start.date || "").getTime())
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:block">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </button>

        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-4">Google Services</h2>
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors group">
                <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                <span>Classroom</span>
                <span className="ml-auto text-xs text-gray-400">Soon</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors group">
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                <span>Sheets</span>
                <span className="ml-auto text-xs text-gray-400">Soon</span>
              </button>
              <button 
                onClick={() => router.push("/calendar")}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium bg-orange-50 text-orange-600 rounded-lg"
              >
                <CalendarIcon className="w-5 h-5 text-orange-600" />
                <span>Calendar</span>
              </button>
              <button 
                onClick={() => router.push("/drive")}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors group"
              >
                <FolderOpen className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                <span>Drive</span>
              </button>
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-4">Quick Actions</h2>
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors group">
                <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                <span>Analytics</span>
                <span className="ml-auto text-xs text-gray-400">Soon</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors group">
                <UserCheck className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                <span>Attendance</span>
                <span className="ml-auto text-xs text-gray-400">Soon</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                <p className="text-sm text-gray-500">Manage your schedule and events</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Month Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(year, month, day)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const dayEvents = getEventsForDate(date)
                  
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square p-2 rounded-lg border transition-all hover:border-orange-300 hover:bg-orange-50 ${
                        isToday ? "bg-orange-500 text-white font-bold border-orange-500" : "border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="text-sm">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="flex justify-center gap-1 mt-1">
                          {dayEvents.slice(0, 3).map((_, idx) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-orange-500"}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Upcoming Events Mini List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming</h3>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((event, idx) => {
                  const color = getEventColor(idx)
                  return (
                    <div key={event.id} className={`flex items-center gap-3 p-2 rounded ${color.bg}`}>
                      <div className={`w-1 h-8 rounded ${color.border.replace("border-l-", "bg-")}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.summary}</p>
                        <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No upcoming events</p>
              ) : (
                upcomingEvents.map((event, idx) => {
                  const color = getEventColor(idx)
                  return (
                    <div key={event.id} className={`border-l-4 ${color.border} ${color.bg} rounded-r-lg p-4`}>
                      <h3 className="font-semibold text-gray-900 mb-1">{event.summary}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatEventTime(event)}</span>
                      </div>
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">{formatEventDate(event)}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
        </main>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDate ? `New Event - ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "New Event"}
              </h2>
              <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Team Standup"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add notes or details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label className="text-sm text-gray-700">All day event</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.title}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
