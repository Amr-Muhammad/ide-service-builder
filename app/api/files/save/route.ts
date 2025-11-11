import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { fileId, content } = await request.json();

    // 1. Update JSON Server
    await fetch(`http://localhost:4000/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    // 2. Get file info from JSON Server
    const fileResponse = await fetch(`http://localhost:4000/files/${fileId}`);
    const file = await fileResponse.json();

    // 3. Write to actual file on disk
    const filePath = path.join(
      process.cwd(),
      'moc-workspace',
      'ws-1',
      'apps',
      file.serviceId === 'svc-1' ? 'service-1' : 'service-2',
      file.path
    );

    await fs.writeFile(filePath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'File saved successfully',
    });
  } catch (error) {
    console.error('Save file error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file' }, { status: 500 });
  }
}
