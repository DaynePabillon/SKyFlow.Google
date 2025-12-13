"use client"

import { Cloud, Mail, Users, FolderKanban, CheckSquare } from "lucide-react"

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/auth/google`)
      const data = await response.json()
      window.location.href = data.authUrl
    } catch (error) {
      console.error('Failed to initiate Google login:', error)
      alert('Failed to connect to authentication server. Please try again.')
    }
  }

  const features = [
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your organization",
    },
    {
      icon: FolderKanban,
      title: "Project Management",
      description: "Organize and track projects efficiently",
    },
    {
      icon: CheckSquare,
      title: "Task Tracking",
      description: "Manage tasks with deadlines and priorities",
    },
  ]

  return (
    <div className="min-h-screen bg-palladian flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-fantastic/10 via-burning-flame/5 to-truffle-trouble/10 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-fantastic to-abyssal-anchorfish rounded-xl mb-4 shadow-lg">
              <Cloud className="w-8 h-8 text-burning-flame" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-fantastic to-abyssal-anchorfish bg-clip-text text-transparent mb-2">SkyFlow</h1>
            <p className="text-lg text-truffle-trouble">Organizational Project Management Platform</p>
          </div>

          {/* Login Section */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-oatmeal shadow-lg">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-blue-fantastic mb-2">
                  Sign in to SkyFlow
                </h2>
                <p className="text-sm text-truffle-trouble">
                  Connect with your Google Workspace account
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-gradient-to-r from-blue-fantastic to-abyssal-anchorfish text-white hover:shadow-lg transition-all duration-200 font-medium"
                >
                  <Mail className="w-5 h-5" />
                  Sign in with Google
                </button>

                <p className="text-xs text-center text-truffle-trouble">
                  You'll be redirected to Google to sign in securely.
                </p>
              </div>
            </div>

            {/* Features preview */}
            <div className="grid md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-oatmeal">
                  <feature.icon className="w-8 h-8 text-blue-fantastic mb-3" />
                  <h3 className="font-semibold text-blue-fantastic mb-2">{feature.title}</h3>
                  <p className="text-sm text-truffle-trouble">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Additional Features */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-oatmeal">
              <h3 className="font-semibold text-blue-fantastic mb-4">What's Included</h3>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-truffle-trouble">
                <li>✓ Google Calendar Integration</li>
                <li>✓ Google Drive File Management</li>
                <li>✓ Project & Task Tracking</li>
                <li>✓ Team Collaboration Tools</li>
                <li>✓ Time Tracking & Analytics</li>
                <li>✓ Real-time Updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
