"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Plane, Briefcase, Check, ChevronRight } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useThemeMode } from '@/context/ThemeContext'

interface Organization {
    id: string
    name: string
    role: 'admin' | 'manager' | 'member'
}

export default function SettingsPage() {
    const router = useRouter()
    const { themeMode, setThemeMode, isProfessionalMode, isAviationMode } = useThemeMode()
    const [user, setUser] = useState<any>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/login')
            return
        }

        const fetchData = async () => {
            try {
                // Fetch user
                const userRes = await fetch('http://localhost:3001/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (!userRes.ok) throw new Error('Not authenticated')
                const userData = await userRes.json()
                setUser(userData)

                // Fetch organizations
                const orgsRes = await fetch('http://localhost:3001/api/organizations', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (orgsRes.ok) {
                    const orgsData = await orgsRes.json()
                    setOrganizations(orgsData)
                    if (orgsData.length > 0) {
                        setSelectedOrg(orgsData[0])
                    }
                }

                // Fetch user preferences
                const prefsRes = await fetch('http://localhost:3001/api/users/preferences', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (prefsRes.ok) {
                    const prefsData = await prefsRes.json()
                    if (prefsData.theme_mode) {
                        // Sync from server
                        localStorage.setItem('skyflow_theme_mode', prefsData.theme_mode)
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router])

    const handleThemeChange = async (mode: 'professional' | 'aviation') => {
        setSaving(true)
        try {
            await setThemeMode(mode)
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600">Loading settings...</p>
                </div>
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
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                            <Settings className="w-6 h-6 text-gray-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    </div>
                    <p className="text-gray-500">Customize your SkyFlow experience</p>
                </div>

                {/* Theme Mode Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Interface Mode</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose how you want SkyFlow to look and feel</p>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Professional Mode */}
                        <button
                            onClick={() => handleThemeChange('professional')}
                            disabled={saving}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${isProfessionalMode
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`p-3 rounded-xl ${isProfessionalMode ? 'bg-blue-500' : 'bg-gray-100'}`}>
                                <Briefcase className={`w-6 h-6 ${isProfessionalMode ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Professional Mode</h3>
                                    {isProfessionalMode && (
                                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Active</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Clean, corporate interface inspired by Trello and Monday.com. Perfect for formal work environments.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">Dashboard</span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">Tasks</span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">Kanban Boards</span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">Projects</span>
                                </div>
                            </div>
                            {isProfessionalMode && (
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                            )}
                        </button>

                        {/* Aviation Mode */}
                        <button
                            onClick={() => handleThemeChange('aviation')}
                            disabled={saving}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${isAviationMode
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`p-3 rounded-xl ${isAviationMode ? 'bg-amber-500' : 'bg-gray-100'}`}>
                                <Plane className={`w-6 h-6 ${isAviationMode ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Aviation Mode</h3>
                                    {isAviationMode && (
                                        <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">Active</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Fun, aviation-themed interface with boarding passes and flight metaphors. Makes work feel like an adventure!
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg">Control Tower</span>
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg">Flights</span>
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg">Boarding Passes</span>
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg">Flight Manifest</span>
                                </div>
                            </div>
                            {isAviationMode && (
                                <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
                        <p className="text-sm text-gray-500 mt-1">Your account information</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            {user?.profile_picture ? (
                                <img src={user.profile_picture} alt="" className="w-16 h-16 rounded-full" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                                    {user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {saving && (
                    <div className="fixed bottom-6 right-6 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
