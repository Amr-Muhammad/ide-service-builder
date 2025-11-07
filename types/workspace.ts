// types/workspace.ts

import { ChildProcess } from 'child_process';

export interface Workspace {
  id: string;
  name: string;
  path: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  workspaceId: string;
  port: number;
  status: 'stopped' | 'starting' | 'running' | 'error';
  fileTree: FileTreeItem[];
}

export interface FileTreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileTreeItem[];
}

export interface FileContent {
  id: string;
  serviceId: string;
  path: string;
  name: string;
  content: string;
}

export interface WebSocketMessage {
  type: 'file-change' | 'save-success' | 'save-error' | 'preview-ready' | 'preview-error';
  fileId?: string;
  content?: string;
  message?: string;
  url?: string;
}

export interface RunningServer {
  process: ChildProcess;
  port: number;
  serviceName: string;
}
