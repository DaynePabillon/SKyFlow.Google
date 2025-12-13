"use client"

import { useState, useEffect } from "react"
import { FolderOpen, File, FileText, Image, Video, Music, Upload, Search, Grid3x3, List, MoreVertical, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/layout/AppLayout"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  webViewLink?: string
  iconLink?: string
  thumbnailLink?: string
  owners?: Array<{ displayName: string }>
}

interface Organization {
  id: string
  name: string
  role: 'admin' | 'manager' | 'member'
}

export default function DrivePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderName, setFolderName] = useState("")

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
      fetchFiles()
    }
  }, [user])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`http://localhost:3001/api/drive/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch files")

      const data = await response.json()
      setFiles(data.files || [])
    } catch (err) {
      console.error("Error fetching files:", err)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return <FolderOpen className="w-6 h-6 text-blue-500" />
    if (mimeType.includes("image")) return <Image className="w-6 h-6 text-green-500" />
    if (mimeType.includes("video")) return <Video className="w-6 h-6 text-red-500" />
    if (mimeType.includes("audio")) return <Music className="w-6 h-6 text-purple-500" />
    if (mimeType.includes("document") || mimeType.includes("text")) return <FileText className="w-6 h-6 text-blue-600" />
    if (mimeType.includes("spreadsheet")) return <FileText className="w-6 h-6 text-green-600" />
    if (mimeType.includes("presentation")) return <FileText className="w-6 h-6 text-orange-500" />
    if (mimeType.includes("pdf")) return <FileText className="w-6 h-6 text-red-600" />
    return <File className="w-6 h-6 text-gray-400" />
  }

  const handleFileClick = (file: DriveFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, "_blank")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("http://localhost:3001/api/drive/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        fetchFiles()
      }
    } catch (err) {
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateFolder = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("http://localhost:3001/api/drive/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      })

      if (response.ok) {
        fetchFiles()
        setShowFolderModal(false)
        setFolderName("")
      }
    } catch (err) {
      console.error("Folder creation error:", err)
    }
  }

  const formatSize = (bytes?: string) => {
    if (!bytes) return "—"
    const size = parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold text-blue-fantastic">Google Drive</h1>
          <p className="text-truffle-trouble mt-1">Manage your files and folders</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-truffle-trouble" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Folder</span>
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-oatmeal text-blue-fantastic rounded-lg hover:bg-oatmeal/30 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span className="font-medium">{uploading ? "Uploading..." : "Upload"}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="p-2 border border-oatmeal rounded-lg hover:bg-oatmeal/30 transition-colors"
            >
              {viewMode === "list" ? <Grid3x3 className="w-5 h-5 text-blue-fantastic" /> : <List className="w-5 h-5 text-blue-fantastic" />}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-fantastic"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 text-center border border-oatmeal">
            <FolderOpen className="w-16 h-16 text-truffle-trouble mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-blue-fantastic mb-2">No files found</h3>
            <p className="text-truffle-trouble">Upload your first file to get started</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-oatmeal overflow-hidden">
            <table className="w-full">
              <thead className="bg-palladian border-b border-oatmeal">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-blue-fantastic">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-blue-fantastic">Owner</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-blue-fantastic">Modified</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-blue-fantastic">Size</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-blue-fantastic">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className="border-b border-oatmeal hover:bg-palladian cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.mimeType)}
                        <span className="font-medium text-blue-fantastic">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-truffle-trouble">
                      {file.owners?.[0]?.displayName || "Me"}
                    </td>
                    <td className="px-6 py-4 text-sm text-truffle-trouble">
                      {formatDate(file.modifiedTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-truffle-trouble">
                      {formatSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className="p-1 hover:bg-oatmeal/30 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-truffle-trouble" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-oatmeal hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <p className="text-sm font-medium text-blue-fantastic truncate w-full mb-1">
                    {file.name}
                  </p>
                  <p className="text-xs text-truffle-trouble">
                    {formatDate(file.modifiedTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-fantastic">New Folder</h2>
              <button
                onClick={() => setShowFolderModal(false)}
                className="p-1 hover:bg-oatmeal/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-truffle-trouble" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-truffle-trouble mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Untitled folder"
                  className="w-full px-4 py-2 border border-oatmeal rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-fantastic"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="flex-1 px-4 py-2 border border-oatmeal text-blue-fantastic rounded-lg hover:bg-oatmeal/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!folderName}
                  className="flex-1 px-4 py-2 bg-blue-fantastic text-white rounded-lg hover:bg-abyssal-anchorfish transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
