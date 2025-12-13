"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import AdminTeamView from "@/components/team/AdminTeamView"
import ManagerTeamView from "@/components/team/ManagerTeamView"
import MemberTeamView from "@/components/team/MemberTeamView"

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function TeamPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      router.push("/")
      return
    }

    fetch('http://localhost:3001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Authentication failed')
        }
        return res.json()
      })
      .then(data => {
        const { organizations, ...userData } = data
        setUser(userData)
        setOrganizations(organizations || [])
        if (organizations && organizations.length > 0) {
          setSelectedOrg(organizations[0])
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Auth error:', err)
        setIsLoading(false)
      })
  }, [router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-palladian flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-fantastic mx-auto mb-4"></div>
          <p className="text-truffle-trouble">Loading...</p>
        </div>
      </div>
    )
  }

  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-palladian flex items-center justify-center">
        <div className="text-center">
          <p className="text-truffle-trouble">No organization selected</p>
        </div>
      </div>
    )
  }

  let content
  if (selectedOrg.role === 'admin') {
    content = <AdminTeamView user={user} organization={selectedOrg} />
  } else if (selectedOrg.role === 'manager') {
    content = <ManagerTeamView user={user} organization={selectedOrg} />
  } else {
    content = <MemberTeamView user={user} organization={selectedOrg} />
  }

  return (
    <AppLayout
      user={user}
      organizations={organizations}
      selectedOrg={selectedOrg}
      onOrgChange={setSelectedOrg}
    >
      {content}
    </AppLayout>
  )
}
