'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  getWorkspaceById,
  getServicesByWorkspaceId,
  getServiceById,
  getFileById,
  updateFileContent,
} from '@/lib/api';
import type { Workspace, Service, FileTreeItem, FileContent } from '@/types/workspace';

// Dynamic import for Monaco Editor (client-side only)
const MonacoEditor = dynamic(() => import('@/components/CodeEditor/MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-400">Loading editor...</div>
  ),
});

function IDEContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace');

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [openFile, setOpenFile] = useState<FileContent | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [startingPreview, setStartingPreview] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace(workspaceId);
    }
  }, [workspaceId]);

  async function loadWorkspace(id: string) {
    try {
      const ws = await getWorkspaceById(id);
      const svcs = await getServicesByWorkspaceId(id);
      setWorkspace(ws);
      setServices(svcs);

      // Auto-select first service
      if (svcs.length > 0) {
        const serviceData = await getServiceById(svcs[0].id);
        setSelectedService(serviceData);
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectService(serviceId: string) {
    try {
      const serviceData = await getServiceById(serviceId);
      setSelectedService(serviceData);
      setOpenFile(null);
      setFileContent('');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load service:', error);
    }
  }

  async function handleOpenFile(fileId: string) {
    try {
      const file = await getFileById(fileId);
      setOpenFile(file);
      setFileContent(file.content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load file:', error);
      alert('Failed to load file');
    }
  }

  function handleEditorChange(value: string) {
    setFileContent(value);
    setHasUnsavedChanges(true);
  }

  async function handleSaveFile() {
    if (!openFile) return;

    setSaving(true);
    try {
      await updateFileContent(openFile.id, fileContent);
      setHasUnsavedChanges(false);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file');
    } finally {
      setSaving(false);
    }
  }

  async function handleStartPreview() {
    if (!selectedService) return;

    setStartingPreview(true);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          port: selectedService.port,
          action: 'start',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewUrl(data.url);
        const updatedServices = services.map((s) =>
          s.id === selectedService.id ? { ...s, status: 'running' as const } : s
        );
        setServices(updatedServices);
        setSelectedService({ ...selectedService, status: 'running' });
      } else {
        alert('Failed to start preview: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to start preview:', error);
      alert('Failed to start preview');
    } finally {
      setStartingPreview(false);
    }
  }

  async function handleStopPreview() {
    if (!selectedService) return;

    try {
      await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          action: 'stop',
        }),
      });

      setPreviewUrl(null);
      const updatedServices = services.map((s) =>
        s.id === selectedService.id ? { ...s, status: 'stopped' as const } : s
      );
      setServices(updatedServices);
      setSelectedService({ ...selectedService, status: 'stopped' });
    } catch (error) {
      console.error('Failed to stop preview:', error);
    }
  }

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && openFile) {
          handleSaveFile();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, openFile, fileContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-gray-400">Loading workspace...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-xl text-red-400 mb-4">Workspace not found</div>
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back
          </Link>
          <div className="h-6 w-px bg-gray-700" />
          <h1 className="text-lg font-semibold">{workspace.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {/* Service Selector */}
      <div className="h-12 border-b border-gray-800 flex items-center px-4 bg-gray-900 gap-2">
        <span className="text-sm text-gray-400">Service:</span>
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleSelectService(service.id)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition ${
              selectedService?.id === service.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {service.name}
          </button>
        ))}
      </div>

      {/* Main IDE Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Tree */}
        <div className="w-64 border-r border-gray-800 bg-gray-950 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">File Explorer</h2>
            {selectedService ? (
              <div className="space-y-1">
                {selectedService.fileTree.map((item) => (
                  <FileTreeNode
                    key={item.id}
                    item={item}
                    level={0}
                    onFileClick={handleOpenFile}
                    selectedFileId={openFile?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No service selected</div>
            )}
          </div>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Editor Header */}
          {openFile && (
            <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-300">{openFile.name}</span>
                {hasUnsavedChanges && <span className="text-xs text-orange-400">● Unsaved</span>}
              </div>
              <button
                onClick={handleSaveFile}
                disabled={!hasUnsavedChanges || saving}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded text-sm font-medium transition"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1">
            {openFile ? (
              <MonacoEditor
                value={fileContent}
                onChange={handleEditorChange}
                language={getLanguageFromFilename(openFile.name)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <div className="text-lg mb-2">No file open</div>
                  <div className="text-sm text-gray-600">
                    Select a file from the tree to start editing
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        {/* Right Panel - Preview */}
        <div className="w-1/3 border-l border-gray-800 bg-gray-950 flex flex-col">
          <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-400">Preview</span>
              {selectedService?.status === 'running' && (
                <span className="text-xs text-green-400">● Running</span>
              )}
            </div>
            <div className="flex gap-2">
              {selectedService?.status === 'running' ? (
                <button
                  onClick={handleStopPreview}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition"
                >
                  ■ Stop
                </button>
              ) : (
                <button
                  onClick={handleStartPreview}
                  disabled={startingPreview}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition"
                >
                  {startingPreview ? 'Starting...' : '▶ Start Preview'}
                </button>
              )}
            </div>
          </div>
          <div className="flex-1">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-0" title="Preview" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🖥️</div>
                  <div className="text-lg mb-2">Preview not started</div>
                  <div className="text-sm text-gray-600">
                    Click `Start Preview` to see your service
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// File Tree Node Component
function FileTreeNode({
  item,
  level,
  onFileClick,
  selectedFileId,
}: {
  item: FileTreeItem;
  level: number;
  onFileClick: (fileId: string) => void;
  selectedFileId?: string;
}) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const isSelected = item.type === 'file' && item.id === selectedFileId;

  if (item.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left px-2 py-1.5 hover:bg-gray-800 rounded text-sm flex items-center gap-2 text-gray-300"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <span className="text-gray-500">{isOpen ? '📂' : '📁'}</span>
          {item.name}
        </button>
        {isOpen && item.children && (
          <div>
            {item.children.map((child) => (
              <FileTreeNode
                key={child.id}
                item={child}
                level={level + 1}
                onFileClick={onFileClick}
                selectedFileId={selectedFileId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileClick(item.id)}
      className={`w-full text-left px-2 py-1.5 hover:bg-gray-800 rounded text-sm flex items-center gap-2 transition ${
        isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
      }`}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      <span className="text-gray-500">📄</span>
      {item.name}
    </button>
  );
}

// Helper function to detect language from filename
function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    html: 'html',
    md: 'markdown',
  };
  return languageMap[ext || ''] || 'typescript';
}

export default function IDEPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      }
    >
      <IDEContent />
    </Suspense>
  );
}
