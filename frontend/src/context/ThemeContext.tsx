"use client"

import { API_URL } from '@/lib/api/client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type ThemeMode = 'professional' | 'aviation'

interface ThemeContextType {
    themeMode: ThemeMode
    setThemeMode: (mode: ThemeMode) => void
    isAviationMode: boolean
    isProfessionalMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
    children: ReactNode
    initialMode?: ThemeMode
}

export function ThemeProvider({ children, initialMode = 'professional' }: ThemeProviderProps) {
    const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Load from localStorage on mount
        const saved = localStorage.getItem('skyflow_theme_mode') as ThemeMode | null
        if (saved && (saved === 'professional' || saved === 'aviation')) {
            setThemeModeState(saved)
        }
    }, [])

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode)
        localStorage.setItem('skyflow_theme_mode', mode)

        // Optionally sync to backend
        try {
            const token = localStorage.getItem('token')
            if (token) {
                await fetch(`${API_URL}/api/users/preferences`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ theme_mode: mode })
                })
            }
        } catch (error) {
            console.error('Error saving theme preference:', error)
        }
    }

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <ThemeContext.Provider value={{
                themeMode: initialMode,
                setThemeMode,
                isAviationMode: initialMode === 'aviation',
                isProfessionalMode: initialMode === 'professional'
            }}>
                {children}
            </ThemeContext.Provider>
        )
    }

    return (
        <ThemeContext.Provider value={{
            themeMode,
            setThemeMode,
            isAviationMode: themeMode === 'aviation',
            isProfessionalMode: themeMode === 'professional'
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useThemeMode() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useThemeMode must be used within a ThemeProvider')
    }
    return context
}

// Helper labels based on mode
export function useThemeLabels() {
    const { isProfessionalMode } = useThemeMode()

    return {
        dashboard: isProfessionalMode ? 'Dashboard' : 'Control Tower',
        tasks: isProfessionalMode ? 'Tasks' : 'Flights',
        projects: isProfessionalMode ? 'Projects' : 'Hangars',
        boards: isProfessionalMode ? 'Boards' : 'Flight Manifest',
        team: isProfessionalMode ? 'Team' : 'Crew',
        status: {
            todo: isProfessionalMode ? 'To Do' : 'Boarding',
            inProgress: isProfessionalMode ? 'In Progress' : 'In Flight',
            review: isProfessionalMode ? 'Review' : 'Landing',
            done: isProfessionalMode ? 'Done' : 'Arrived'
        }
    }
}
