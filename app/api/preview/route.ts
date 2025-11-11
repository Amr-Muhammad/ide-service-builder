import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { updateServiceStatus } from '@/lib/api';
import { RunningServer } from '@/types/workspace';

// Store running dev servers
const runningServers: Record<string, RunningServer> = {};

export async function POST(request: NextRequest) {
  try {
    const { serviceId, serviceName, port, action } = await request.json();

    if (action === 'start') {
      // Check if already running
      if (runningServers[serviceId]) {
        return NextResponse.json({
          success: true,
          message: 'Server already running',
          url: `http://localhost:${port}`,
        });
      }

      // Path to service
      const servicePath = path.join(process.cwd(), 'moc-workspace', 'ws-1', 'apps', serviceName);

      // Start dev server
      const devServer = exec(`npm run dev -- --port ${port}`, { cwd: servicePath }, (error) => {
        if (error) {
          console.error(`Dev server error for ${serviceName}:`, error);
          delete runningServers[serviceId];
        }
      });

      // Store process
      runningServers[serviceId] = {
        process: devServer,
        port,
        serviceName,
      };

      // Wait a bit for server to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update status in JSON Server
      await updateServiceStatus(serviceId, 'running');

      return NextResponse.json({
        success: true,
        message: 'Dev server started',
        url: `http://localhost:${port}`,
      });
    }

    if (action === 'stop') {
      const server = runningServers[serviceId];
      if (server && server.process.pid) {
        console.log('server found');
        // Windows-compatible kill
        if (process.platform === 'win32') {
          console.log('win');
          
          exec(`taskkill /PID ${server.process.pid} /T /F`);
        } else {
          console.log('mac / linux');
          server.process.kill();
        }
        delete runningServers[serviceId];
        await updateServiceStatus(serviceId, 'stopped');
      }

      return NextResponse.json({
        success: true,
        message: 'Dev server stopped',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage preview server' },
      { status: 500 }
    );
  }
}
