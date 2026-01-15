'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { 
  FolderSync, 
  FileSpreadsheet, 
  RefreshCw, 
  Check, 
  Link2, 
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Users,
  FolderPlus,
  Cloud
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
}

interface Workspace {
  id: string;
  name: string;
  root_folder_id: string;
  root_folder_name: string;
  sync_status: string;
  last_synced_at: string;
  sheet_count: number;
  task_count: number;
}

interface DriveFolder {
  id: string;
  name: string;
}

interface DriveSheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface SyncedSheet {
  id: string;
  sheet_id: string;
  sheet_name: string;
  sync_status: string;
  last_synced_at: string;
  task_count: number;
}

export default function WorkspaceSyncPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [driveSheets, setDriveSheets] = useState<DriveSheet[]>([]);
  const [syncedSheets, setSyncedSheets] = useState<SyncedSheet[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  
  // Create workspace modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [newFolderId, setNewFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  
  // Connect sheet modal
  const [showConnectSheet, setShowConnectSheet] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [allSheets, setAllSheets] = useState<DriveSheet[]>([]);
  const [createNewSheet, setCreateNewSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [creatingSheet, setCreatingSheet] = useState(false);

  // Load user and orgs from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedOrgs = localStorage.getItem('organizations');
    const storedSelectedOrg = localStorage.getItem('selectedOrganization');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedOrgs) setOrganizations(JSON.parse(storedOrgs));
    if (storedSelectedOrg) setSelectedOrg(JSON.parse(storedSelectedOrg));

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    if (!user) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject('Auth failed'))
        .then(data => {
          const { organizations: orgs, ...userData } = data;
          setUser(userData);
          setOrganizations(orgs || []);
          if (orgs?.length > 0 && !selectedOrg) {
            setSelectedOrg(orgs[0]);
          }
        })
        .catch(err => console.error('Auth error:', err));
    }
  }, [mounted, router, user, selectedOrg]);

  useEffect(() => {
    if (selectedOrg) {
      fetchWorkspaces();
    }
  }, [selectedOrg?.id]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchWorkspaceDetails();
    }
  }, [selectedWorkspace?.id]);

  const fetchWorkspaces = async () => {
    if (!selectedOrg) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/workspaces?organizationId=${selectedOrg.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  const fetchWorkspaceDetails = async () => {
    if (!selectedWorkspace) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/workspaces/${selectedWorkspace.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSyncedSheets(data.sheets || []);
      
      const sheetsRes = await fetch(`${API_URL}/api/workspaces/${selectedWorkspace.id}/drive-sheets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sheetsData = await sheetsRes.json();
      setDriveSheets(sheetsData.sheets || []);
    } catch (err) {
      console.error('Error fetching workspace details:', err);
    }
  };

  const fetchAllSheets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/sheets/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAllSheets(data.files || []);
    } catch (err) {
      console.error('Error fetching sheets:', err);
    }
  };

  const createNewSheetInWorkspace = async () => {
    if (!newSheetName.trim() || !selectedWorkspace) return;
    setCreatingSheet(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/sheets/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newSheetName.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        setSelectedSheetId(data.spreadsheet.id);
        setSelectedSheetName(data.spreadsheet.name);
        setCreateNewSheet(false);
        setNewSheetName('');
        // Refresh sheet lists
        await fetchAllSheets();
      }
    } catch (err) {
      console.error('Error creating sheet:', err);
      setError('Failed to create sheet');
    } finally {
      setCreatingSheet(false);
    }
  };

  const fetchDriveFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/drive/files?q=mimeType='application/vnd.google-apps.folder'`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDriveFolders(data.files || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const createDriveFolder = async () => {
    if (!newFolderInput.trim()) return;
    setCreatingFolder(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/drive/folder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newFolderInput.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewFolderId(data.folder.id);
        setNewFolderName(data.folder.name);
        setCreateNewFolder(false);
        setNewFolderInput('');
        // Refresh folder list
        await fetchDriveFolders();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const createWorkspace = async () => {
    if (!newFolderId || !newFolderName || !selectedOrg) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: selectedOrg.id,
          folderId: newFolderId,
          folderName: newFolderName
        })
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNewFolderId('');
        setNewFolderName('');
        fetchWorkspaces();
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError('Failed to create workspace');
    }
  };

  const connectSheet = async () => {
    if (!selectedWorkspace || !selectedSheetId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/workspaces/${selectedWorkspace.id}/connect-sheet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sheetId: selectedSheetId,
          sheetName: selectedSheetName
        })
      });
      
      if (res.ok) {
        setShowConnectSheet(false);
        setSelectedSheetId('');
        setSelectedSheetName('');
        fetchWorkspaceDetails();
        fetchWorkspaces();
      }
    } catch (err) {
      console.error('Error connecting sheet:', err);
      setError('Failed to connect sheet');
    }
  };

  const syncWorkspace = async () => {
    if (!selectedWorkspace) return;
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/workspaces/${selectedWorkspace.id}/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWorkspaceDetails();
      fetchWorkspaces();
    } catch (err) {
      console.error('Error syncing:', err);
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const deleteWorkspace = async (id: string) => {
    if (!confirm('Delete this workspace? All synced data will be removed.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/workspaces/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedWorkspace(null);
      fetchWorkspaces();
    } catch (err) {
      console.error('Error deleting workspace:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const handleOrgChange = (org: Organization) => {
    setSelectedOrg(org);
    localStorage.setItem('selectedOrganization', JSON.stringify(org));
  };

  if (!mounted || !user) {
    return null;
  }

  return (
    <AppLayout
      user={user}
      organizations={organizations}
      selectedOrg={selectedOrg}
      onOrgChange={handleOrgChange}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Workspace Sync</h1>
            <p className="text-gray-500 text-sm">Connect Google Sheets as live task databases</p>
          </div>
          
          <button
            onClick={() => {
              fetchDriveFolders();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Connect Workspace
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Workspaces List */}
          <div className="col-span-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              Connected Workspaces
            </h2>
            
            {workspaces.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FolderSync className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-gray-500">No workspaces connected</p>
                <p className="text-sm mt-1 text-gray-400">Click "Connect Workspace" to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workspaces.map(ws => (
                  <div
                    key={ws.id}
                    onClick={() => setSelectedWorkspace(ws)}
                    className={`p-4 rounded-lg cursor-pointer transition border ${
                      selectedWorkspace?.id === ws.id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800">{ws.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ws.sync_status === 'active' ? 'bg-green-100 text-green-700' :
                        ws.sync_status === 'syncing' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ws.sync_status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3" />
                        {ws.sheet_count} sheets
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ws.task_count} tasks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workspace Details */}
          <div className="col-span-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            {!selectedWorkspace ? (
              <div className="text-center py-20 text-gray-400">
                <Cloud className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg text-gray-500">Select a workspace to view details</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedWorkspace.name}</h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      Last synced: {formatDate(selectedWorkspace.last_synced_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={syncWorkspace}
                      disabled={syncing}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => {
                        fetchAllSheets();
                        setShowConnectSheet(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Link2 className="w-4 h-4" />
                      Connect Sheet
                    </button>
                    <button
                      onClick={() => deleteWorkspace(selectedWorkspace.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Connected Sheets */}
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-500" />
                  Connected Sheets
                </h3>
                
                {syncedSheets.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-gray-500">No sheets connected yet</p>
                    <p className="text-sm mt-1 text-gray-400">Connect a Google Sheet to start syncing tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {syncedSheets.map(sheet => (
                      <div key={sheet.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{sheet.sheet_name}</h4>
                            <p className="text-xs text-gray-500">
                              {sheet.task_count} tasks • Last synced: {formatDate(sheet.last_synced_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                            <Check className="w-3 h-3 inline mr-1" />
                            Synced
                          </span>
                          <a 
                            href={`https://docs.google.com/spreadsheets/d/${sheet.sheet_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Open in Sheets ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Connect Workspace</h2>
            <p className="text-gray-500 text-sm mb-4">
              Select a Google Drive folder or create a new one as your workspace root.
            </p>
            
            <div className="space-y-4">
              {!createNewFolder ? (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Drive Folder</label>
                  <select
                    value={newFolderId}
                    onChange={(e) => {
                      setNewFolderId(e.target.value);
                      const folder = driveFolders.find(f => f.id === e.target.value);
                      setNewFolderName(folder?.name || '');
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a folder...</option>
                    {driveFolders.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setCreateNewFolder(true)}
                    className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Create new folder instead
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">New Folder Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFolderInput}
                      onChange={(e) => setNewFolderInput(e.target.value)}
                      placeholder="Enter folder name..."
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={createDriveFolder}
                      disabled={creatingFolder || !newFolderInput.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingFolder ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      setCreateNewFolder(false);
                      setNewFolderInput('');
                    }}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to folder selection
                  </button>
                </div>
              )}
              
              {newFolderName && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <Check className="w-4 h-4 inline mr-2" />
                  Will create workspace: <strong>{newFolderName}</strong>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateNewFolder(false);
                  setNewFolderInput('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={createWorkspace}
                disabled={!newFolderId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                Connect Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Sheet Modal */}
      {showConnectSheet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Connect Google Sheet</h2>
            <p className="text-gray-500 text-sm mb-4">
              Select an existing sheet or create a new one to sync as a task database.
            </p>
            
            <div className="space-y-4">
              {!createNewSheet ? (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Your Google Sheets</label>
                  <select
                    value={selectedSheetId}
                    onChange={(e) => {
                      setSelectedSheetId(e.target.value);
                      const sheet = allSheets.find(s => s.id === e.target.value);
                      setSelectedSheetName(sheet?.name || '');
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a sheet...</option>
                    {allSheets.map(sheet => (
                      <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setCreateNewSheet(true)}
                    className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create new sheet instead
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">New Sheet Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      placeholder="e.g. Project Tasks"
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={createNewSheetInWorkspace}
                      disabled={creatingSheet || !newSheetName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingSheet ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      setCreateNewSheet(false);
                      setNewSheetName('');
                    }}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to sheet selection
                  </button>
                </div>
              )}
              
              {selectedSheetName && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                  Will connect: <strong>{selectedSheetName}</strong>
                  <br />
                  <span className="text-xs text-blue-600">Columns auto-detected: Title, Status, Priority, Assignee, Due Date</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConnectSheet(false);
                  setCreateNewSheet(false);
                  setNewSheetName('');
                  setSelectedSheetId('');
                  setSelectedSheetName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={connectSheet}
                disabled={!selectedSheetId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                Connect & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
