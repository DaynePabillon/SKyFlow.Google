"use client"

import { useState, useEffect } from "react"
import { FolderOpen, File, FileText, Image, Video, Music, Download, Share2, Trash2, ArrowLeft, Upload, BookOpen, Calendar, BarChart3, UserCheck, Search, Grid3x3, List, MoreVertical, Star, Clock, Users, HardDrive, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

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

interface StorageInfo {
  used: number
  total: number
}

export default function DrivePage() {
  const router = useRouter()
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState<"home" | "my-drive" | "shared" | "recent" | "starred" | "trash">("my-drive")
  const [storageInfo] = useState<StorageInfo>({ used: 8.21, total: 15 })
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState({ title: "", message: "", type: "success" as "success" | "error" })
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderName, setFolderName] = useState("")

  useEffect(() => {
    fetchFiles()
  }, [selectedView])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch(`http://localhost:3001/api/drive/files?view=${selectedView}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch files")

      const data = await response.json()
      setFiles(data.files || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files")
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

  const handleDownload = (file: DriveFile, e: React.MouseEvent) => {
    e.stopPropagation()
    if (file.webViewLink) {
      window.open(file.webViewLink, "_blank")
    }
  }

  const showSuccessModal = (title: string, message: string) => {
    setModalMessage({ title, message, type: "success" })
    setShowModal(true)
  }

  const showErrorModal = (title: string, message: string) => {
    setModalMessage({ title, message, type: "error" })
    setShowModal(true)
  }

  const handleShare = (file: DriveFile, e: React.MouseEvent) => {
    e.stopPropagation()
    if (file.webViewLink) {
      navigator.clipboard.writeText(file.webViewLink)
      showSuccessModal("Link Copied", `Share link for "${file.name}" copied to clipboard!`)
    }
  }

  const handleDelete = (file: DriveFile, e: React.MouseEvent) => {
    e.stopPropagation()
    showErrorModal("Coming Soon", "Delete functionality will be available soon!")
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

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
        showSuccessModal("Upload Successful", `File "${file.name}" uploaded to Google Drive!`)
        fetchFiles()
        setShowNewMenu(false)
      } else {
        throw new Error("Upload failed")
      }
    } catch (err) {
      showErrorModal("Upload Failed", "Failed to upload file. Please try again.")
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch("http://localhost:3001/api/drive/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      })

      if (response.ok) {
        showSuccessModal("Folder Created", `Folder "${folderName}" created in Google Drive!`)
        fetchFiles()
        setShowNewMenu(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Folder creation failed")
      }
    } catch (err) {
      showErrorModal("Creation Failed", err instanceof Error ? err.message : "Failed to create folder. Please try again.")
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
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const folders = filteredFiles.filter((f) => f.mimeType.includes("folder"))
  const regularFiles = filteredFiles.filter((f) => !f.mimeType.includes("folder"))

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar - Drive Navigation */}
      <aside className="w-64 border-r border-gray-200 p-4 hidden lg:flex flex-col overflow-y-auto">
        {/* New Button with Dropdown */}
        <div className="relative mb-4">
          <button 
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <Plus className="w-5 h-5 text-gray-700" />
            <span className="font-medium text-gray-700">New</span>
          </button>
          
          {showNewMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => {
                  setShowFolderModal(true)
                  setShowNewMenu(false)
                  setFolderName("Untitled folder")
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
              >
                <FolderOpen className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">New folder</span>
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <label className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">File upload</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <label className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                <FolderOpen className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Folder upload</span>
                <input
                  type="file"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                  multiple
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>

        {/* Drive Navigation */}
        <nav className="space-y-1 mb-6">
          <button
            onClick={() => setSelectedView("home")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
              selectedView === "home" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button
            onClick={() => setSelectedView("my-drive")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
              selectedView === "my-drive" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <HardDrive className="w-5 h-5" />
            <span className="font-medium">My Drive</span>
          </button>
          <button
            onClick={() => setSelectedView("shared")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
              selectedView === "shared" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Shared with me</span>
          </button>
          <button
            onClick={() => setSelectedView("recent")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
              selectedView === "recent" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Recent</span>
          </button>
          <button
            onClick={() => setSelectedView("starred")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
              selectedView === "starred" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Star className="w-5 h-5" />
            <span className="font-medium">Starred</span>
          </button>
          <button
            onClick={() => setSelectedView("trash")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${
              selectedView === "trash" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Trash</span>
          </button>
        </nav>

        {/* Google Services Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3 px-4">Google Services</h2>
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Classroom</span>
              <span className="ml-auto text-xs text-gray-400">Soon</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Sheets</span>
              <span className="ml-auto text-xs text-gray-400">Soon</span>
            </button>
            <button
              onClick={() => router.push("/calendar")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Calendar</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full bg-blue-50 text-blue-600">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Drive</span>
            </button>
          </nav>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3 px-4">Quick Actions</h2>
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Analytics</span>
              <span className="ml-auto text-xs text-gray-400">Soon</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
              <UserCheck className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Attendance</span>
              <span className="ml-auto text-xs text-gray-400">Soon</span>
            </button>
          </nav>
        </div>

        {/* Storage Info */}
        <div className="px-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Storage</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${(storageInfo.used / storageInfo.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {storageInfo.used} GB of {storageInfo.total} GB used
          </p>
          <button className="text-xs text-blue-600 hover:underline mt-1">Get more storage</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Search */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="px-6 py-3 flex items-center gap-4">
            <button onClick={() => router.push("/")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in Drive"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-full transition-colors ${
                  viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                <List className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full transition-colors ${
                  viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                <Grid3x3 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchFiles}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? "No files found" : "Welcome to Drive"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? "Try a different search term" : "Upload your first file to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Suggested Folders */}
                {folders.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-700 mb-3">Suggested folders</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {folders.slice(0, 6).map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleFileClick(folder)}
                          className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all group"
                        >
                          <FolderOpen className="w-12 h-12 text-blue-500 mb-2" />
                          <p className="text-sm text-gray-900 truncate w-full text-center">{folder.name}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              // Show context menu
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files List/Grid */}
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-3">Suggested files</h2>
                  
                  {viewMode === "list" ? (
                    /* List View */
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last modified</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File size</th>
                            <th className="px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {regularFiles.map((file) => (
                            <tr 
                              key={file.id} 
                              onClick={() => handleFileClick(file)}
                              className="hover:bg-gray-50 cursor-pointer group"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  {getFileIcon(file.mimeType)}
                                  <span className="text-sm text-gray-900 truncate max-w-md">{file.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600">me</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600">{formatDate(file.modifiedTime)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600">{formatSize(file.size)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => handleShare(file, e)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-all"
                                    title="Share"
                                  >
                                    <Share2 className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(file, e)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-all"
                                  >
                                    <MoreVertical className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Grid View */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {regularFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleFileClick(file)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all group"
                        >
                          <div className="flex flex-col items-center">
                            <div className="mb-3">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <p className="text-sm text-gray-900 truncate w-full text-center mb-1">{file.name}</p>
                            <p className="text-xs text-gray-500 mb-2">{formatSize(file.size)}</p>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleShare(file, e)}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-all"
                                title="Share"
                              >
                                <Share2 className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(file, e)}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-all"
                              >
                                <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">New folder</h2>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onFocus={(e) => e.target.select()}
              autoFocus
              className="w-full px-4 py-3 border-2 border-blue-500 rounded focus:outline-none focus:border-blue-600 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === "Enter" && folderName.trim()) {
                  handleCreateFolder(folderName)
                  setShowFolderModal(false)
                  setFolderName("")
                } else if (e.key === "Escape") {
                  setShowFolderModal(false)
                  setFolderName("")
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFolderModal(false)
                  setFolderName("")
                }}
                className="px-6 py-2 text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (folderName.trim()) {
                    handleCreateFolder(folderName)
                    setShowFolderModal(false)
                    setFolderName("")
                  }
                }}
                disabled={!folderName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {modalMessage.type === "success" ? (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">{modalMessage.title}</h2>
            </div>
            <p className="text-gray-600 mb-6">{modalMessage.message}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
