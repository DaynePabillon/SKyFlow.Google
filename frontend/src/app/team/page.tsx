"use client"

import { API_URL } from '@/lib/api/client'
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
  const [mounted, setMounted] = useState(false)

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedOrgs = localStorage.getItem('organizations')
    const storedSelectedOrg = localStorage.getItem('selectedOrganization')

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    if (storedOrgs) {
      setOrganizations(JSON.parse(storedOrgs))
    }
    if (storedSelectedOrg) {
      setSelectedOrg(JSON.parse(storedSelectedOrg))
    }

    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const token = localStorage.getItem("token")

    if (!token) {
      router.push("/")
      return
    }

    if (!user) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.ok ? res.json() : Promise.reject('Auth failed'))
        .then(data => {
          const { organizations: orgs, ...userData } = data
          setUser(userData)
          setOrganizations(orgs || [])
          if (orgs && orgs.length > 0 && !selectedOrg) {
            setSelectedOrg(orgs[0])
          }
        })
        .catch(err => console.error('Auth error:', err))
    }
  }, [mounted, router, user, selectedOrg])

  // Show nothing until mounted to prevent hydration mismatch
  if (!mounted || !user) {
    return null
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
