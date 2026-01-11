"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"
import AdminProjectView from "@/components/projects/AdminProjectView"
import ManagerProjectView from "@/components/projects/ManagerProjectView"
import MemberProjectView from "@/components/projects/MemberProjectView"

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function ProjectsPage() {
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
      fetch('http://localhost:3001/api/auth/me', {
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

  // Render role-specific view
  let content
  if (selectedOrg.role === 'admin') {
    content = <AdminProjectView user={user} organization={selectedOrg} />
  } else if (selectedOrg.role === 'manager') {
    content = <ManagerProjectView user={user} organization={selectedOrg} />
  } else {
    content = <MemberProjectView user={user} organization={selectedOrg} />
  }

  // Handler to persist org change to localStorage
  const handleOrgChange = (org: Organization) => {
    setSelectedOrg(org)
    localStorage.setItem('selectedOrganization', JSON.stringify(org))
  }

  return (
    <AppLayout
      user={user}
      organizations={organizations}
      selectedOrg={selectedOrg}
      onOrgChange={handleOrgChange}
    >
      {content}
    </AppLayout>
  )
}
