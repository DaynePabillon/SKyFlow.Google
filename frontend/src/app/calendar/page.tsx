"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Plus, Clock, Users, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"

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

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function CalendarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
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
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    const storedOrgs = localStorage.getItem("organizations")

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        const orgsData = storedOrgs ? JSON.parse(storedOrgs) : []
        setUser(userData)
        setOrganizations(orgsData)
        if (orgsData.length > 0) {
          setSelectedOrg(orgsData[0])
        }
      } catch (e) {
        console.error('Error parsing stored user data:', e)
      }
    }

    if (token) {
      fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Authentication failed')
          return res.json()
        })
        .then(data => {
          const { organizations, ...userData } = data
          setUser(userData)
          setOrganizations(organizations || [])
          if (organizations && organizations.length > 0) {
            setSelectedOrg(organizations[0])
          }
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('organizations', JSON.stringify(organizations || []))
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch user info:', err)
          setIsLoading(false)
        })
    } else {
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("http://localhost:3001/api/calendar/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch events")

      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error("Error fetching events:", err)
      setEvents([])
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AppLayout
      user={user}
      organizations={organizations}
      selectedOrg={selectedOrg}
      onOrgChange={setSelectedOrg}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-fantastic">Google Calendar</h1>
          <p className="text-truffle-trouble mt-1">Manage your schedule and events</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Month Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-oatmeal p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-blue-fantastic">{monthName}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                    className="p-2 hover:bg-oatmeal/30 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-truffle-trouble" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                    className="p-2 hover:bg-oatmeal/30 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-truffle-trouble" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-truffle-trouble py-2">
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
                      className={`aspect-square p-2 rounded-lg border transition-all hover:border-blue-fantastic hover:bg-blue-50 ${isToday ? "bg-blue-fantastic text-white font-bold border-blue-fantastic" : "border-oatmeal hover:shadow-sm"
                        }`}
                    >
                      <div className="text-sm">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="flex justify-center gap-1 mt-1">
                          {dayEvents.slice(0, 3).map((_, idx) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-blue-fantastic"}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Upcoming Events Mini List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-oatmeal p-6">
              <h3 className="text-sm font-semibold text-blue-fantastic mb-4">Upcoming</h3>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((event, idx) => {
                  const color = getEventColor(idx)
                  return (
                    <div key={event.id} className={`flex items-center gap-3 p-2 rounded ${color.bg}`}>
                      <div className={`w-1 h-8 rounded ${color.border.replace("border-l-", "bg-")}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-fantastic truncate">{event.summary}</p>
                        <p className="text-xs text-truffle-trouble">{formatEventTime(event)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-oatmeal p-6">
            <h2 className="text-lg font-semibold text-blue-fantastic mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-fantastic" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-truffle-trouble text-center py-8">No upcoming events</p>
              ) : (
                upcomingEvents.map((event, idx) => {
                  const color = getEventColor(idx)
                  return (
                    <div key={event.id} className={`border-l-4 ${color.border} ${color.bg} rounded-r-lg p-4`}>
                      <h3 className="font-semibold text-blue-fantastic mb-1">{event.summary}</h3>
                      <div className="flex items-center gap-2 text-xs text-truffle-trouble mb-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatEventTime(event)}</span>
                      </div>
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-truffle-trouble">
                          <Users className="w-3 h-3" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      )}
                      <p className="text-xs text-truffle-trouble mt-2">{formatEventDate(event)}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blue-fantastic">
                {selectedDate ? `New Event - ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "New Event"}
              </h2>
              <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-oatmeal/30 rounded-lg">
                <X className="w-5 h-5 text-truffle-trouble" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-truffle-trouble mb-2">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:ring-2 focus:ring-blue-fantastic focus:border-transparent"
                  placeholder="Team Standup"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-truffle-trouble mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:ring-2 focus:ring-blue-fantastic focus:border-transparent"
                  rows={3}
                  placeholder="Add notes or details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-truffle-trouble mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:ring-2 focus:ring-blue-fantastic focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-truffle-trouble mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:ring-2 focus:ring-blue-fantastic focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="w-4 h-4 text-blue-fantastic border-oatmeal rounded focus:ring-blue-fantastic"
                />
                <label className="text-sm text-truffle-trouble">All day event</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 border border-oatmeal text-blue-fantastic rounded-lg hover:bg-oatmeal/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.title}
                  className="flex-1 px-4 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
