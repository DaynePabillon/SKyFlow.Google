"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Cloud, ArrowRight, ArrowLeft, Check } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6

  // Step 1: Purpose and Role
  const [purpose, setPurpose] = useState("")
  const [role, setRole] = useState("")

  // Step 2: Team Size
  const [teamSize, setTeamSize] = useState("")

  // Step 3: Focus Areas
  const [focusAreas, setFocusAreas] = useState<string[]>([])

  // Step 4: How did you hear
  const [hearAbout, setHearAbout] = useState("")

  // Step 5: Team Members
  const [teamMembers, setTeamMembers] = useState([
    { email: "", role: "admin" },
    { email: "", role: "admin" }
  ])

  // Step 6: Workspace Name
  const [workspaceName, setWorkspaceName] = useState("")

  const purposes = ["Work", "Personal", "School", "Nonprofit"]
  const roles = ["Undergraduate student", "Graduate student", "Faculty member", "Other"]
  const teamSizes = ["Only me", "2-5", "6-10", "11-25", "26-50", "51-100", "101-500"]
  const focusOptions = [
    "Business operations",
    "Individual work",
    "Resource management",
    "Group assignments",
    "Administrative work",
    "Student organizations",
    "Project management",
    "Curriculum and Syllabus management",
    "Task management",
    "Portfolio management",
    "Goals and strategy",
    "Requests and approvals",
    "Academic research",
    "CRM",
    "Other"
  ]
  const hearAboutOptions = [
    "Facebook / Instagram",
    "Software Review Site",
    "Friend",
    "Consultant",
    "AI Chatbots (e.g. ChatGPT, Claude, etc.)",
    "Podcast",
    "News publications",
    "YouTube",
    "Email",
    "Events/Conferences",
    "Online search engines (e.g. Google, Bing, etc.)",
    "LinkedIn",
    "TV / Streaming",
    "Audio streaming services",
    "Outdoors ad (billboards / transport / airport)",
    "Other"
  ]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    const onboardingData = {
      purpose,
      role,
      teamSize,
      focusAreas,
      hearAbout,
      teamMembers: teamMembers.filter(m => m.email),
      workspaceName
    }

    try {
      const token = localStorage.getItem("token")
      await fetch("http://localhost:3001/api/users/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(onboardingData)
      })

      localStorage.setItem("onboardingCompleted", "true")
      router.push("/")
    } catch (error) {
      console.error("Failed to save onboarding data:", error)
      router.push("/")
    }
  }

  const toggleFocusArea = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area))
    } else {
      setFocusAreas([...focusAreas, area])
    }
  }

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { email: "", role: "admin" }])
  }

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updated = [...teamMembers]
    updated[index] = { ...updated[index], [field]: value }
    setTeamMembers(updated)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return purpose && role
      case 2:
        return teamSize
      case 3:
        return focusAreas.length > 0
      case 4:
        return hearAbout
      case 5:
        return true
      case 6:
        return workspaceName.trim().length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-xl mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600">SkyFlow</span>
          </div>

          {/* Step 1: Purpose and Role */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Hey there, what brings you here today?
                </h1>
              </div>

              <div>
                <div className="flex flex-wrap gap-3">
                  {purposes.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPurpose(p)}
                      className={`px-6 py-3 rounded-full border-2 transition-all ${
                        purpose === p
                          ? "border-blue-500 bg-blue-500 text-white shadow-md"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  What best describes your current role?
                </h2>
                <div className="flex flex-wrap gap-3">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-6 py-3 rounded-full border-2 transition-all ${
                        role === r
                          ? "border-blue-500 bg-blue-500 text-white shadow-md"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Team Size */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-gray-800">
                How many people are on your team?
              </h1>

              <div className="grid grid-cols-2 gap-3">
                {teamSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setTeamSize(size)}
                    className={`px-6 py-4 rounded-xl border-2 transition-all text-left ${
                      teamSize === size
                        ? "border-blue-500 bg-blue-500 text-white shadow-md"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Focus Areas */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Select what you'd like to focus on first
                </h1>
                <p className="text-gray-600">
                  Help us tailor the best experience for you
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {focusOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleFocusArea(option)}
                    className={`px-4 py-3 rounded-full border-2 transition-all ${
                      focusAreas.includes(option)
                        ? "border-blue-500 bg-blue-500 text-white shadow-md"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: How did you hear */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-gray-800">
                One last question, how did you hear about us?
              </h1>

              <div className="space-y-2">
                {hearAboutOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setHearAbout(option)}
                    className={`w-full px-6 py-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      hearAbout === option
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:border-blue-500"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      hearAbout === option ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}>
                      {hearAbout === option && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-gray-700">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Invite Team */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Who else is on your team?
              </h1>

              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="email"
                      placeholder="Add email here"
                      value={member.email}
                      onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none"
                    />
                    <select
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, "role", e.target.value)}
                      className="px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                ))}
                <button
                  onClick={addTeamMember}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  + Add another
                </button>
              </div>

              <button
                onClick={handleNext}
                className="text-gray-600 hover:text-blue-500"
              >
                Remind me later
              </button>
            </div>
          )}

          {/* Step 6: Workspace Name */}
          {currentStep === 6 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Let's start working together
                </h1>
                <p className="text-gray-600">
                  Give your workspace a name, e.g. marketing plan, sales pipeline, quarterly roadmap...
                </p>
              </div>

              <input
                type="text"
                placeholder="Enter workspace name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none text-lg"
                autoFocus
              />

              <p className="text-sm text-gray-600">
                In SkyFlow, "workspaces" are the place where all of your content lives.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12">
            {currentStep > 1 && currentStep < 6 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-blue-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div></div>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {currentStep === totalSteps ? "Get started" : "Continue"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="w-64 h-64 mx-auto mb-8 bg-white/10 rounded-3xl backdrop-blur-sm flex items-center justify-center">
            <Cloud className="w-32 h-32 text-white/80" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to SkyFlow</h2>
          <p className="text-lg text-white/90">
            Streamline your projects and collaborate with your team
          </p>
        </div>
      </div>
    </div>
  )
}
