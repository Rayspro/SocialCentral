import { storage } from './storage';
import { auditLogger } from './audit-logger';

interface ScheduledServer {
  serverId: number;
  intervalId: NodeJS.Timeout;
  checkCount: number;
  lastStatus: string;
  createdAt: Date;
  lastCheckedAt: Date;
}

class ServerScheduler {
  private scheduledServers: Map<number, ScheduledServer> = new Map();
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_CHECKS = 40; // 20 minutes max (40 * 30s)

  async scheduleServerMonitoring(serverId: number): Promise<void> {
    // Don't schedule if already monitoring
    if (this.scheduledServers.has(serverId)) {
      return;
    }

    const server = await storage.getVastServer(serverId);
    if (!server) {
      console.error(`Server ${serverId} not found for scheduling`);
      return;
    }

    console.log(`Starting scheduler monitoring for server ${serverId}: ${server.name}`);

    // Log scheduler start (remove audit log to avoid foreign key constraint)
    console.log(`Scheduler started for server ${serverId}: ${server.name}`);

    const intervalId = setInterval(async () => {
      await this.checkServerStatus(serverId);
    }, this.CHECK_INTERVAL);

    const scheduledServer: ScheduledServer = {
      serverId,
      intervalId,
      checkCount: 0,
      lastStatus: server.status || 'unknown',
      createdAt: new Date(),
      lastCheckedAt: new Date()
    };

    this.scheduledServers.set(serverId, scheduledServer);

    // Update server with scheduler info
    await storage.updateVastServer(serverId, {
      schedulerActive: true,
      schedulerChecks: 0,
      schedulerStarted: new Date()
    });
  }

  async checkServerStatus(serverId: number): Promise<void> {
    const scheduledServer = this.scheduledServers.get(serverId);
    if (!scheduledServer) {
      return;
    }

    try {
      scheduledServer.checkCount++;
      scheduledServer.lastCheckedAt = new Date();

      const server = await storage.getVastServer(serverId);
      if (!server) {
        console.error(`Server ${serverId} not found during status check`);
        this.removeScheduler(serverId);
        return;
      }

      const previousStatus = scheduledServer.lastStatus;
      scheduledServer.lastStatus = server.status || 'unknown';

      // Update server with check count
      await storage.updateVastServer(serverId, {
        schedulerChecks: scheduledServer.checkCount,
        schedulerLastCheck: new Date()
      });

      console.log(`Scheduler check ${scheduledServer.checkCount} for server ${serverId}: ${server.status}`);

      // Log status check
      console.log(`Status check ${scheduledServer.checkCount} for server ${serverId}: ${previousStatus} -> ${server.status}`);

      // If server is running and ComfyUI not set up, initiate setup
      if (server.status === 'running' && server.setupStatus !== 'ready') {
        console.log(`Server ${serverId} is running, initiating ComfyUI setup`);
        await this.initiateComfyUISetup(serverId);
        this.removeScheduler(serverId);
        return;
      }

      // If server is stopped or error state, stop monitoring
      if (server.status === 'stopped' || server.status === 'error') {
        console.log(`Server ${serverId} is in terminal state: ${server.status}, stopping scheduler`);
        await this.logSchedulerCompletion(serverId, `server_${server.status}`);
        this.removeScheduler(serverId);
        return;
      }

      // If max checks reached, stop monitoring
      if (scheduledServer.checkCount >= this.MAX_CHECKS) {
        console.log(`Max checks reached for server ${serverId}, stopping scheduler`);
        await this.logSchedulerCompletion(serverId, 'max_checks_reached');
        this.removeScheduler(serverId);
        return;
      }

    } catch (error) {
      console.error(`Error checking server ${serverId} status:`, error);
      
      // Log error and continue monitoring
      console.error(`Scheduler error for server ${serverId}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async initiateComfyUISetup(serverId: number): Promise<void> {
    try {
      const server = await storage.getVastServer(serverId);
      if (!server) {
        return;
      }

      // Update server status to configuring
      await storage.updateVastServer(serverId, {
        status: 'configuring',
        setupStatus: 'installing'
      });

      // Log ComfyUI setup initiation
      console.log(`ComfyUI setup initiated for server ${serverId}: ${server.name} (auto-setup)`);

      // Get ComfyUI setup script
      const setupScripts = await storage.getSetupScripts();
      const comfyUIScript = setupScripts.find(s => s.name === 'ComfyUI Setup');
      
      if (!comfyUIScript) {
        throw new Error('ComfyUI setup script not found');
      }

      // Create execution record
      const execution = await storage.createServerExecution({
        serverId,
        scriptId: comfyUIScript.id,
        status: 'pending',
        startedAt: new Date(),
      });

      // Simulate ComfyUI setup process
      setTimeout(async () => {
        try {
          const isSuccess = Math.random() > 0.1; // 90% success rate for auto setup
          
          if (isSuccess) {
            await storage.updateServerExecution(execution.id, {
              status: 'completed',
              output: `ComfyUI setup completed successfully!\n\nAutomatic installation triggered by scheduler.\n\nComfyUI is now running at http://server:8188`,
              completedAt: new Date(),
            });

            await storage.updateVastServer(serverId, {
              status: 'running',
              setupStatus: 'ready'
            });

            // Log successful setup
            console.log(`ComfyUI setup completed successfully for server ${serverId}: ${server.name}`);

          } else {
            await storage.updateServerExecution(execution.id, {
              status: 'failed',
              output: 'ComfyUI setup failed. Please try manual setup.',
              errorMessage: 'Setup script execution failed',
              completedAt: new Date(),
            });

            await storage.updateVastServer(serverId, {
              status: 'running',
              setupStatus: 'failed'
            });

            // Log failed setup
            console.error(`ComfyUI setup failed for server ${serverId}: ${server.name} - Setup script execution failed`);
          }
        } catch (error) {
          console.error('Error during ComfyUI setup:', error);
        }
      }, 5000); // 5 second setup simulation

    } catch (error) {
      console.error(`Error initiating ComfyUI setup for server ${serverId}:`, error);
      
      console.error(`ComfyUI setup error for server ${serverId}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async logSchedulerCompletion(serverId: number, reason: string): Promise<void> {
    const scheduledServer = this.scheduledServers.get(serverId);
    if (!scheduledServer) {
      return;
    }

    const duration = Date.now() - scheduledServer.createdAt.getTime();
    
    await storage.createAuditLog({
      category: 'system_event',
      userId: 1,
      action: 'scheduler_completed',
      resource: 'vast_server',
      resourceId: serverId.toString(),
      details: {
        reason,
        totalChecks: scheduledServer.checkCount,
        duration: `${Math.round(duration / 1000)}s`,
        finalStatus: scheduledServer.lastStatus
      },
      severity: 'info'
    });
  }

  removeScheduler(serverId: number): void {
    const scheduledServer = this.scheduledServers.get(serverId);
    if (!scheduledServer) {
      return;
    }

    clearInterval(scheduledServer.intervalId);
    this.scheduledServers.delete(serverId);

    // Update server to remove scheduler info
    storage.updateVastServer(serverId, {
      schedulerActive: false
    }).catch(error => {
      console.error(`Error updating server ${serverId} scheduler status:`, error);
    });

    console.log(`Scheduler removed for server ${serverId}`);
  }

  getSchedulerInfo(serverId: number): ScheduledServer | null {
    return this.scheduledServers.get(serverId) || null;
  }

  getAllScheduledServers(): ScheduledServer[] {
    return Array.from(this.scheduledServers.values());
  }

  stopAllSchedulers(): void {
    for (const serverId of this.scheduledServers.keys()) {
      this.removeScheduler(serverId);
    }
  }
}

export const serverScheduler = new ServerScheduler();