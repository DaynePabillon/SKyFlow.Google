"use client"

import { useState, useEffect } from "react"
import { Users, UserPlus, Search, Crown, Briefcase, User } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  joined_at: string
  status: string
}

interface ManagerTeamViewProps {
  user: any
  organization: {
    id: string
    name: string
    role: string
  }
}

export default function ManagerTeamView({ user, organization }: ManagerTeamViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchMembers()
  }, [organization.id])

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/organizations/${organization.id}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        setMembers([])
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      setMembers(data.members || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="w-4 h-4" />
    if (role === 'manager') return <Briefcase className="w-4 h-4" />
    return <User className="w-4 h-4" />
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
      member: { label: 'Member', color: 'bg-green-100 text-green-700' }
    }
    return badges[role as keyof typeof badges] || badges.member
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-fantastic"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-fantastic">Team Members</h1>
            <p className="text-truffle-trouble mt-1">View team in {organization.name}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors">
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Invite Member</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-truffle-trouble" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-oatmeal overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-oatmeal">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-truffle-trouble uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-truffle-trouble uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-truffle-trouble uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-truffle-trouble uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oatmeal">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-palladian transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-fantastic to-abyssal-anchorfish rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-blue-fantastic">{member.name}</div>
                        <div className="text-sm text-truffle-trouble">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.role).color}`}>
                      {getRoleIcon(member.role)}
                      {getRoleBadge(member.role).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-truffle-trouble">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-truffle-trouble mx-auto mb-4 opacity-50" />
            <p className="text-truffle-trouble">No members found</p>
          </div>
        )}
      </div>
    </div>
  )
}
