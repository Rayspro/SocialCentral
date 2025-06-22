import { storage } from "./storage";

export class ServerScheduler {
  private schedulers = new Map<number, NodeJS.Timeout>();
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_CHECKS = 20; // 10 minutes total

  async scheduleServerMonitoring(serverId: number): Promise<void> {
    // Remove any existing scheduler
    if (this.schedulers.has(serverId)) {
      clearInterval(this.schedulers.get(serverId)!);
      this.schedulers.delete(serverId);
    }

    const server = await storage.getVastServer(serverId);
    if (!server) {
      console.error(`Server ${serverId} not found for scheduling`);
      return;
    }

    console.log(`Starting scheduler monitoring for server ${serverId}: ${server.name}`);

    // Log scheduler start
    try {
      await storage.createAuditLog({
        category: 'system_event',
        userId: null,
        action: 'scheduler_started',
        resource: 'vast_server',
        resourceId: serverId.toString(),
        details: {
          serverName: server.name,
          checkInterval: this.CHECK_INTERVAL,
          maxChecks: this.MAX_CHECKS
        },
        severity: 'info'
      });
    } catch (error) {
      console.error('Error logging scheduler start:', error);
    }

    const intervalId = setInterval(async () => {
      await this.checkServerStatus(serverId);
    }, this.CHECK_INTERVAL);

    this.schedulers.set(serverId, intervalId);

    // Update server scheduler status
    await storage.updateVastServer(serverId, {
      schedulerActive: true,
      schedulerStarted: new Date(),
      schedulerChecks: 0
    });
  }

  private async checkServerStatus(serverId: number): Promise<void> {
    try {
      const server = await storage.getVastServer(serverId);
      if (!server) {
        this.removeScheduler(serverId);
        return;
      }

      // Check if we've exceeded max checks
      if (server.schedulerChecks >= this.MAX_CHECKS) {
        console.log(`Max checks reached for server ${serverId}, stopping scheduler`);
        this.removeScheduler(serverId);
        return;
      }

      // Update check count
      await storage.updateVastServer(serverId, {
        schedulerChecks: server.schedulerChecks + 1,
        schedulerLastCheck: new Date()
      });

      console.log(`Scheduler check ${server.schedulerChecks + 1} for server ${serverId}: ${server.status}`);

      // If server is running and ComfyUI not set up, initiate setup
      if (server.status === 'running' && server.setupStatus !== 'ready') {
        await this.initiateComfyUISetup(serverId);
        this.removeScheduler(serverId);
        return;
      }

      // If server setup is complete, stop monitoring
      if (server.setupStatus === 'ready') {
        console.log(`Server ${serverId} setup complete, stopping scheduler`);
        this.removeScheduler(serverId);
        return;
      }

      // If server is in error state, stop monitoring
      if (server.status === 'error' || server.setupStatus === 'failed') {
        console.log(`Server ${serverId} in error state, stopping scheduler`);
        this.removeScheduler(serverId);
        return;
      }

    } catch (error) {
      console.error(`Error checking server ${serverId} status:`, error);
      // Continue monitoring on errors, will eventually timeout
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

      // Get ComfyUI setup script
      const setupScripts = await storage.getSetupScripts();
      const comfyUIScript = setupScripts.find(s => s.name.toLowerCase().includes('comfy'));
      
      if (!comfyUIScript) {
        console.error('ComfyUI setup script not found');
        return;
      }

      // Create execution record
      const execution = await storage.createServerExecution({
        serverId: serverId,
        scriptId: comfyUIScript.id,
        status: 'running',
        startedAt: new Date()
      });

      // Execute setup (simulate for now)
      setTimeout(async () => {
        try {
          await storage.updateServerExecution(execution.id, {
            status: 'completed',
            completedAt: new Date(),
            output: 'ComfyUI setup completed successfully'
          });

          await storage.updateVastServer(serverId, {
            status: 'running',
            setupStatus: 'ready'
          });

          console.log(`ComfyUI setup completed for server ${serverId}`);
        } catch (error) {
          console.error(`Error completing setup for server ${serverId}:`, error);
          
          await storage.updateServerExecution(execution.id, {
            status: 'failed',
            completedAt: new Date(),
            errorLog: error instanceof Error ? error.message : 'Setup failed'
          });

          await storage.updateVastServer(serverId, {
            status: 'error',
            setupStatus: 'failed'
          });
        }
      }, 60000); // 1 minute setup simulation

    } catch (error) {
      console.error(`Error initiating ComfyUI setup for server ${serverId}:`, error);
    }
  }

  private removeScheduler(serverId: number): void {
    if (this.schedulers.has(serverId)) {
      clearInterval(this.schedulers.get(serverId)!);
      this.schedulers.delete(serverId);
      
      // Update server scheduler status
      storage.updateVastServer(serverId, {
        schedulerActive: false
      }).catch(error => {
        console.error(`Error updating scheduler status for server ${serverId}:`, error);
      });
    }
  }

  stopAllSchedulers(): void {
    for (const [serverId, intervalId] of this.schedulers) {
      clearInterval(intervalId);
      console.log(`Stopped scheduler for server ${serverId}`);
    }
    this.schedulers.clear();
  }

  getActiveSchedulers(): number[] {
    return Array.from(this.schedulers.keys());
  }

  async getSchedulerInfo(serverId: number): Promise<any> {
    const server = await storage.getVastServer(serverId);
    if (!server) {
      return null;
    }

    const isActive = this.schedulers.has(serverId);
    
    return {
      serverId,
      isActive,
      schedulerActive: server.schedulerActive,
      schedulerStarted: server.schedulerStarted,
      schedulerLastCheck: server.schedulerLastCheck,
      schedulerChecks: server.schedulerChecks || 0,
      maxChecks: this.MAX_CHECKS,
      checkInterval: this.CHECK_INTERVAL,
      status: server.status,
      setupStatus: server.setupStatus
    };
  }
}

export const serverScheduler = new ServerScheduler();