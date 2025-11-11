'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWorkspaces, createWorkspace } from '@/lib/api';
import type { Workspace } from '@/types/workspace';

export default function Home() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWorkspace() {
    if (!newWorkspaceName.trim()) return;

    setCreating(true);
    try {
      const workspace = await createWorkspace(newWorkspaceName);
      router.push(`/ide?workspace=${workspace.id}`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      alert('Failed to create workspace');
    } finally {
      setCreating(false);
    }
  }

  function handleConnectWorkspace(workspaceId: string) {
    router.push(`/ide?workspace=${workspaceId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Tawakalna Builder
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Build and preview your Tawakalna services
          </p>
        </div>

        {/* Actions */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Connect to Existing Workspace */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Connect to Workspace
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select an existing workspace to continue working
            </p>

            {workspaces.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-500 italic">
                No workspaces found. Create one to get started!
              </p>
            ) : (
              <div className="space-y-3">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleConnectWorkspace(workspace.id)}
                    className="cursor-pointer w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {workspace.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Created: {new Date(workspace.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create New Workspace */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Workspace
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start a fresh workspace for your services
            </p>

            <button
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition"
            >
              + Create Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Workspace
            </h3>

            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Enter workspace name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateWorkspace();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim() || creating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
