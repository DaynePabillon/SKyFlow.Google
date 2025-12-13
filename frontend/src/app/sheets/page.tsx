"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, Search, MoreVertical, Clock, Users, Download, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"

interface Spreadsheet {
  id: string
  name: string
  modifiedTime: string
  webViewLink?: string
  iconLink?: string
  owners?: Array<{ displayName: string }>
}

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function SheetsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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
      fetchSpreadsheets()
    }
  }, [user])

  const fetchSpreadsheets = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch("http://localhost:3001/api/sheets/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch spreadsheets")

      const data = await response.json()
      setSpreadsheets(data.files || [])
    } catch (err) {
      console.error("Error fetching spreadsheets:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSheets = spreadsheets.filter(sheet =>
    sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-fantastic">Google Sheets</h1>
          <p className="text-truffle-trouble mt-1">Manage your spreadsheets</p>
        </div>
        {/* Search and Actions */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-truffle-trouble" />
            <input
              type="text"
              placeholder="Search spreadsheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors">
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Sheet</span>
          </button>
        </div>

        {/* Spreadsheets Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-fantastic"></div>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 text-center border border-oatmeal">
            <FileText className="w-16 h-16 text-truffle-trouble mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-blue-fantastic mb-2">No spreadsheets found</h3>
            <p className="text-truffle-trouble mb-6">Create your first spreadsheet to get started</p>
            <button className="px-6 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors">
              Create Spreadsheet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSheets.map((sheet) => (
              <div
                key={sheet.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-oatmeal shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-fantastic truncate">{sheet.name}</h3>
                      <p className="text-xs text-truffle-trouble">
                        {new Date(sheet.modifiedTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-oatmeal/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5 text-truffle-trouble" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-truffle-trouble">
                  <Clock className="w-3 h-3" />
                  <span>Modified {new Date(sheet.modifiedTime).toLocaleDateString()}</span>
                </div>

                {sheet.owners && sheet.owners.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-truffle-trouble mt-2">
                    <Users className="w-3 h-3" />
                    <span>{sheet.owners[0].displayName}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-oatmeal">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-fantastic hover:bg-blue-50 rounded-lg transition-colors">
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-fantastic hover:bg-blue-50 rounded-lg transition-colors">
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
