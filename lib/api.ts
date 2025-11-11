// lib/api.ts

import { Workspace, Service, FileContent } from "@/types/workspace";

const API_BASE_URL = "http://localhost:4000";

// Workspaces
export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${API_BASE_URL}/workspaces`);
  if (!response.ok) throw new Error("Failed to fetch workspaces");
  return response.json();
}

export async function getWorkspaceById(id: string): Promise<Workspace> {
  const response = await fetch(`${API_BASE_URL}/workspaces/${id}`);
  if (!response.ok) throw new Error("Failed to fetch workspace");
  return response.json();
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      path: `/moc-workspace/${Date.now()}`,
      createdAt: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error("Failed to create workspace");
  return response.json();
}

// Services
export async function getServicesByWorkspaceId(
  workspaceId: string
): Promise<Service[]> {
  const response = await fetch(
    `${API_BASE_URL}/services?workspaceId=${workspaceId}`
  );
  if (!response.ok) throw new Error("Failed to fetch services");
  return response.json();
}

export async function getServiceById(id: string): Promise<Service> {
  const response = await fetch(`${API_BASE_URL}/services/${id}`);
  if (!response.ok) throw new Error("Failed to fetch service");
  return response.json();
}

export async function updateServiceStatus(
  id: string,
  status: Service["status"]
): Promise<Service> {
  const response = await fetch(`${API_BASE_URL}/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update service status");
  return response.json();
}

// Files
export async function getFileById(id: string): Promise<FileContent> {
  const response = await fetch(`${API_BASE_URL}/files/${id}`);
  if (!response.ok) throw new Error("Failed to fetch file");
  return response.json();
}

export async function updateFileContent(
  id: string,
  content: string
): Promise<FileContent> {
  const response = await fetch(`${API_BASE_URL}/files/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("Failed to update file");
  return response.json();
}

export async function createFile(
  serviceId: string,
  path: string,
  name: string,
  content: string = ""
): Promise<FileContent> {
  const response = await fetch(`${API_BASE_URL}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: `f-${Date.now()}`,
      serviceId,
      path,
      name,
      content,
    }),
  });
  if (!response.ok) throw new Error("Failed to create file");
  return response.json();
}

export async function deleteFile(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/files/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete file");
}
