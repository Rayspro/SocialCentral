import { storage } from "./storage";
import type { InsertAuditLog } from "@shared/schema";
import type { Request } from "express";

export interface AuditContext {
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  request?: Request;
}

export class AuditLogger {
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private extractRequestInfo(req?: Request): Pick<InsertAuditLog, 'ipAddress' | 'userAgent'> {
    if (!req) return {};
    
    return {
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent')
    };
  }

  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      'unknown'
    );
  }

  async log(
    action: string,
    resource: string,
    context: AuditContext,
    details?: any,
    resourceId?: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    category: 'user_action' | 'system_event' | 'security_event' = 'user_action'
  ): Promise<void> {
    try {
      const requestInfo = this.extractRequestInfo(context.request);

      const auditLog: InsertAuditLog = {
        userId: context.userId,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: context.ipAddress || requestInfo.ipAddress,
        userAgent: context.userAgent || requestInfo.userAgent,
        severity,
        category
      };

      await storage.createAuditLog(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw to avoid breaking the main operation
    }
  }

  // Convenience methods for common actions
  async logUserLogin(userId: number, context: AuditContext, success: boolean): Promise<void> {
    await this.log(
      success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      'user',
      context,
      { success, timestamp: new Date().toISOString() },
      userId.toString(),
      success ? 'info' : 'warning',
      'security_event'
    );
  }

  async logUserLogout(userId: number, context: AuditContext): Promise<void> {
    await this.log(
      'LOGOUT',
      'user',
      context,
      { timestamp: new Date().toISOString() },
      userId.toString(),
      'info',
      'security_event'
    );
  }

  async logServerCreate(userId: number, serverId: string, serverData: any, context: AuditContext): Promise<void> {
    await this.log(
      'CREATE',
      'vast_server',
      context,
      { 
        serverName: serverData.name,
        instanceType: serverData.instanceType,
        cost: serverData.cost,
        timestamp: new Date().toISOString()
      },
      serverId,
      'info',
      'user_action'
    );
  }

  async logServerDelete(userId: number, serverId: string, context: AuditContext): Promise<void> {
    await this.log(
      'DELETE',
      'vast_server',
      context,
      { timestamp: new Date().toISOString() },
      serverId,
      'warning',
      'user_action'
    );
  }

  async logServerStart(userId: number, serverId: string, context: AuditContext): Promise<void> {
    await this.log(
      'START',
      'vast_server',
      context,
      { timestamp: new Date().toISOString() },
      serverId,
      'info',
      'user_action'
    );
  }

  async logServerStop(userId: number, serverId: string, context: AuditContext): Promise<void> {
    await this.log(
      'STOP',
      'vast_server',
      context,
      { timestamp: new Date().toISOString() },
      serverId,
      'info',
      'user_action'
    );
  }

  async logComfyGeneration(userId: number, generationId: string, prompt: string, context: AuditContext): Promise<void> {
    await this.log(
      'CREATE',
      'comfy_generation',
      context,
      { 
        prompt: prompt.substring(0, 200), // Limit prompt length in logs
        timestamp: new Date().toISOString()
      },
      generationId,
      'info',
      'user_action'
    );
  }

  async logApiKeyCreate(userId: number, service: string, context: AuditContext): Promise<void> {
    await this.log(
      'CREATE',
      'api_key',
      context,
      { 
        service,
        timestamp: new Date().toISOString()
      },
      service,
      'info',
      'security_event'
    );
  }

  async logApiKeyUpdate(userId: number, service: string, context: AuditContext): Promise<void> {
    await this.log(
      'UPDATE',
      'api_key',
      context,
      { 
        service,
        timestamp: new Date().toISOString()
      },
      service,
      'info',
      'security_event'
    );
  }

  async logApiKeyDelete(userId: number, service: string, context: AuditContext): Promise<void> {
    await this.log(
      'DELETE',
      'api_key',
      context,
      { 
        service,
        timestamp: new Date().toISOString()
      },
      service,
      'warning',
      'security_event'
    );
  }

  async logSystemError(error: Error, resource: string, context: AuditContext, resourceId?: string): Promise<void> {
    await this.log(
      'SYSTEM_ERROR',
      resource,
      context,
      { 
        error: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace length
        timestamp: new Date().toISOString()
      },
      resourceId,
      'error',
      'system_event'
    );
  }

  async logSecurityEvent(event: string, resource: string, context: AuditContext, details?: any): Promise<void> {
    await this.log(
      event,
      resource,
      context,
      {
        ...details,
        timestamp: new Date().toISOString()
      },
      undefined,
      'warning',
      'security_event'
    );
  }
}

export const auditLogger = AuditLogger.getInstance();