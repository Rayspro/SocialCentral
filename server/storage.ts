import { 
  User, 
  Platform, 
  Account, 
  Content, 
  Schedule, 
  ApiKey, 
  VastServer, 
  SetupScript,
  ComfyModel,
  ComfyWorkflow,
  ComfyGeneration,
  AuditLog,
  ServerMood,
  ServerMoodApplication,
  WorkflowAnalysis,
  ServerExecution,
  UserPreferences,
  WorkflowRecommendation,
  UserInteraction,
  type InsertUser,
  type InsertPlatform,
  type InsertAccount,
  type InsertContent,
  type InsertSchedule,
  type InsertApiKey,
  type InsertVastServer,
  type InsertSetupScript,
  type InsertComfyModel,
  type InsertComfyWorkflow,
  type InsertComfyGeneration,
  type InsertAuditLog,
  type InsertServerMood,
  type InsertServerMoodApplication,
  type InsertWorkflowAnalysis,
  type InsertServerExecution,
  type InsertUserPreferences,
  type InsertWorkflowRecommendation,
  type InsertUserInteraction,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Platform operations
  getPlatforms(): Promise<Platform[]>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform>;
  deletePlatform(id: number): Promise<void>;

  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccountsByPlatform(platformId: number): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account>;
  deleteAccount(id: number): Promise<void>;

  // Content operations
  getContent(): Promise<Content[]>;
  getContentByStatus(status: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<InsertContent>): Promise<Content>;
  deleteContent(id: number): Promise<void>;

  // Schedule operations
  getSchedules(): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;

  // API Key operations
  getApiKeys(): Promise<ApiKey[]>;
  getApiKeyByService(service: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;

  // Dashboard analytics
  getDashboardAnalytics(): Promise<{
    totalPlatforms: number;
    totalAccounts: number;
    totalContent: number;
    publishedContent: number;
    scheduledContent: number;
    generatedMedia: number;
  }>;

  // Vast server operations
  getVastServers(): Promise<VastServer[]>;
  getVastServer(id: number): Promise<VastServer | undefined>;
  getVastServerByVastId(vastId: string): Promise<VastServer | undefined>;
  createVastServer(server: InsertVastServer): Promise<VastServer>;
  updateVastServer(id: number, server: Partial<InsertVastServer>): Promise<VastServer>;
  deleteVastServer(id: number): Promise<void>;

  // Setup script operations
  getSetupScripts(): Promise<SetupScript[]>;
  createSetupScript(script: InsertSetupScript): Promise<SetupScript>;
  updateSetupScript(id: number, script: Partial<InsertSetupScript>): Promise<SetupScript>;
  deleteSetupScript(id: number): Promise<void>;

  // ComfyUI operations
  getComfyModels(): Promise<ComfyModel[]>;
  getComfyModelsByServer(serverId: number): Promise<ComfyModel[]>;
  getComfyModel(id: number): Promise<ComfyModel | undefined>;
  getComfyModelByNameAndServer(name: string, serverId: number): Promise<ComfyModel | undefined>;
  createComfyModel(model: InsertComfyModel): Promise<ComfyModel>;
  updateComfyModel(id: number, model: Partial<InsertComfyModel>): Promise<ComfyModel>;
  deleteComfyModel(id: number): Promise<void>;

  getComfyWorkflows(): Promise<ComfyWorkflow[]>;
  getComfyWorkflow(id: number): Promise<ComfyWorkflow | undefined>;
  createComfyWorkflow(workflow: InsertComfyWorkflow): Promise<ComfyWorkflow>;
  updateComfyWorkflow(id: number, workflow: Partial<InsertComfyWorkflow>): Promise<ComfyWorkflow>;
  deleteComfyWorkflow(id: number): Promise<void>;

  getComfyGenerations(): Promise<ComfyGeneration[]>;
  getComfyGenerationsByServer(serverId: number): Promise<ComfyGeneration[]>;
  getComfyGeneration(id: number): Promise<ComfyGeneration | undefined>;
  createComfyGeneration(generation: InsertComfyGeneration): Promise<ComfyGeneration>;
  updateComfyGeneration(id: number, generation: Partial<InsertComfyGeneration>): Promise<ComfyGeneration>;
  deleteComfyGeneration(id: number): Promise<void>;

  // Audit log operations
  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Server mood operations
  getServerMoods(): Promise<ServerMood[]>;
  getServerMoodsByCategory(category: string): Promise<ServerMood[]>;
  getServerMood(id: number): Promise<ServerMood | undefined>;
  createServerMood(mood: InsertServerMood): Promise<ServerMood>;
  updateServerMood(id: number, mood: Partial<InsertServerMood>): Promise<ServerMood>;
  deleteServerMood(id: number): Promise<void>;

  getServerMoodApplications(serverId: number): Promise<ServerMoodApplication[]>;
  getCurrentServerMood(serverId: number): Promise<ServerMoodApplication | undefined>;
  createServerMoodApplication(application: InsertServerMoodApplication): Promise<ServerMoodApplication>;
  revertServerMoodApplication(id: number): Promise<void>;

  // Workflow analysis operations
  getWorkflowAnalyses(serverId?: number): Promise<WorkflowAnalysis[]>;
  getWorkflowAnalysesByServer(serverId: number): Promise<WorkflowAnalysis[]>;
  getWorkflowAnalysis(id: number): Promise<WorkflowAnalysis | undefined>;
  createWorkflowAnalysis(analysis: InsertWorkflowAnalysis): Promise<WorkflowAnalysis>;
  updateWorkflowAnalysis(id: number, analysis: Partial<InsertWorkflowAnalysis>): Promise<WorkflowAnalysis>;
  deleteWorkflowAnalysis(id: number): Promise<boolean>;

  // Server execution operations
  getServerExecutions(serverId?: number): Promise<ServerExecution[]>;
  getServerExecution(id: number): Promise<ServerExecution | undefined>;
  createServerExecution(execution: InsertServerExecution): Promise<ServerExecution>;
  updateServerExecution(id: number, execution: Partial<InsertServerExecution>): Promise<ServerExecution>;

  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | null>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;

  // Workflow recommendations operations
  getWorkflowRecommendations(userId: number): Promise<WorkflowRecommendation[]>;
  createWorkflowRecommendation(recommendation: InsertWorkflowRecommendation): Promise<WorkflowRecommendation>;
  updateWorkflowRecommendation(id: number, recommendation: Partial<InsertWorkflowRecommendation>): Promise<WorkflowRecommendation>;
  deleteWorkflowRecommendation(id: number): Promise<boolean>;

  // User interaction tracking operations
  getUserInteractions(userId: number, limit?: number): Promise<UserInteraction[]>;
  createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;

  // Helper methods for recommendations
  getUserGenerations(userId: number, limit?: number): Promise<ComfyGeneration[]>;
  getRecentGenerations(limit?: number): Promise<ComfyGeneration[]>;

  // Additional required methods
  getWorkflowsWithModels(): Promise<ComfyWorkflow[]>;
  syncWorkflowModels(workflowId: number): Promise<void>;
  searchComfyModels(query: string): Promise<ComfyModel[]>;
  getModelsByStatus(status: string): Promise<ComfyModel[]>;
  getContentById(id: number): Promise<Content | undefined>;
  getPlatform(id: number): Promise<Platform | undefined>;
  getStats(): Promise<any>;
  stopVastServer(id: number): Promise<void>;
  getSetupScriptsByCategory(category: string): Promise<SetupScript[]>;
  getSetupScript(id: number): Promise<SetupScript | undefined>;
  getAuditLogsByUser(userId: number): Promise<AuditLog[]>;
  getAuditLogsByResource(resource: string): Promise<AuditLog[]>;
  getComfyModelsByServerAndFolder(serverId: number, folder: string): Promise<ComfyModel[]>;
}

import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(schema.platforms);
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db.insert(schema.platforms).values(platform).returning();
    return newPlatform;
  }

  async updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform> {
    const [updatedPlatform] = await db.update(schema.platforms)
      .set(platform)
      .where(eq(schema.platforms.id, id))
      .returning();
    return updatedPlatform;
  }

  async deletePlatform(id: number): Promise<void> {
    await db.delete(schema.platforms).where(eq(schema.platforms.id, id));
  }

  async getAccounts(): Promise<Account[]> {
    return await db.select().from(schema.accounts);
  }

  async getAccountsByPlatform(platformId: number): Promise<Account[]> {
    return await db.select().from(schema.accounts).where(eq(schema.accounts.platformId, platformId));
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(schema.accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account> {
    const [updatedAccount] = await db.update(schema.accounts)
      .set(account)
      .where(eq(schema.accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(schema.accounts).where(eq(schema.accounts.id, id));
  }

  async getContent(): Promise<Content[]> {
    return await db.select().from(schema.content);
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    return await db.select().from(schema.content).where(eq(schema.content.status, status));
  }

  async createContent(content: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(schema.content).values(content).returning();
    return newContent;
  }

  async updateContent(id: number, content: Partial<InsertContent>): Promise<Content> {
    const [updatedContent] = await db.update(schema.content)
      .set(content)
      .where(eq(schema.content.id, id))
      .returning();
    return updatedContent;
  }

  async deleteContent(id: number): Promise<void> {
    await db.delete(schema.content).where(eq(schema.content.id, id));
  }

  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schema.schedules);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schema.schedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule> {
    const [updatedSchedule] = await db.update(schema.schedules)
      .set(schedule)
      .where(eq(schema.schedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schema.schedules).where(eq(schema.schedules.id, id));
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(schema.apiKeys);
  }

  async getApiKeyByService(service: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.service, service));
    return apiKey;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db.insert(schema.apiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey> {
    const [updatedApiKey] = await db.update(schema.apiKeys)
      .set(apiKey)
      .where(eq(schema.apiKeys.id, id))
      .returning();
    return updatedApiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));
  }

  async getDashboardAnalytics(): Promise<{
    totalPlatforms: number;
    totalAccounts: number;
    totalContent: number;
    publishedContent: number;
    scheduledContent: number;
    generatedMedia: number;
  }> {
    const platforms = await db.select().from(schema.platforms);
    const accounts = await db.select().from(schema.accounts);
    const content = await db.select().from(schema.content);
    const schedules = await db.select().from(schema.schedules);

    return {
      totalPlatforms: platforms.length,
      totalAccounts: accounts.length,
      totalContent: content.length,
      publishedContent: content.filter(c => c.status === 'published').length,
      scheduledContent: schedules.length,
      generatedMedia: content.filter(c => c.type === 'image' || c.type === 'video').length,
    };
  }

  async getVastServers(): Promise<VastServer[]> {
    return await db.select().from(schema.vastServers);
  }

  async getVastServer(id: number): Promise<VastServer | undefined> {
    const [server] = await db.select().from(schema.vastServers).where(eq(schema.vastServers.id, id));
    return server;
  }

  async getVastServerByVastId(vastId: string): Promise<VastServer | undefined> {
    const [server] = await db.select().from(schema.vastServers).where(eq(schema.vastServers.vastId, vastId));
    return server;
  }

  async createVastServer(server: InsertVastServer): Promise<VastServer> {
    const [newServer] = await db.insert(schema.vastServers).values(server).returning();
    return newServer;
  }

  async updateVastServer(id: number, server: Partial<InsertVastServer>): Promise<VastServer> {
    const [updatedServer] = await db.update(schema.vastServers)
      .set(server)
      .where(eq(schema.vastServers.id, id))
      .returning();
    return updatedServer;
  }

  async deleteVastServer(id: number): Promise<void> {
    await db.delete(schema.vastServers).where(eq(schema.vastServers.id, id));
  }

  async getSetupScripts(): Promise<SetupScript[]> {
    return await db.select().from(schema.setupScripts);
  }

  async createSetupScript(script: InsertSetupScript): Promise<SetupScript> {
    const [newScript] = await db.insert(schema.setupScripts).values(script).returning();
    return newScript;
  }

  async updateSetupScript(id: number, script: Partial<InsertSetupScript>): Promise<SetupScript> {
    const [updatedScript] = await db.update(schema.setupScripts)
      .set(script)
      .where(eq(schema.setupScripts.id, id))
      .returning();
    return updatedScript;
  }

  async deleteSetupScript(id: number): Promise<void> {
    await db.delete(schema.setupScripts).where(eq(schema.setupScripts.id, id));
  }

  async getComfyModels(): Promise<ComfyModel[]> {
    return await db.select().from(schema.comfyModels);
  }

  async getComfyModelsByServer(serverId: number): Promise<ComfyModel[]> {
    return await db.select().from(schema.comfyModels).where(eq(schema.comfyModels.serverId, serverId));
  }

  async getComfyModel(id: number): Promise<ComfyModel | undefined> {
    const [model] = await db.select().from(schema.comfyModels).where(eq(schema.comfyModels.id, id));
    return model;
  }

  async getComfyModelByNameAndServer(name: string, serverId: number): Promise<ComfyModel | undefined> {
    const models = await db.select().from(schema.comfyModels)
      .where(eq(schema.comfyModels.serverId, serverId));
    return models.find(model => model.name === name || model.fileName === name);
  }

  async createComfyModel(model: InsertComfyModel): Promise<ComfyModel> {
    const [newModel] = await db.insert(schema.comfyModels).values(model).returning();
    return newModel;
  }

  async updateComfyModel(id: number, model: Partial<InsertComfyModel>): Promise<ComfyModel> {
    const [updatedModel] = await db.update(schema.comfyModels)
      .set(model)
      .where(eq(schema.comfyModels.id, id))
      .returning();
    return updatedModel;
  }

  async deleteComfyModel(id: number): Promise<void> {
    await db.delete(schema.comfyModels).where(eq(schema.comfyModels.id, id));
  }

  async getComfyWorkflows(): Promise<ComfyWorkflow[]> {
    return await db.select().from(schema.comfyWorkflows);
  }

  async getComfyWorkflow(id: number): Promise<ComfyWorkflow | undefined> {
    const [workflow] = await db.select().from(schema.comfyWorkflows).where(eq(schema.comfyWorkflows.id, id));
    return workflow;
  }

  async createComfyWorkflow(workflow: InsertComfyWorkflow): Promise<ComfyWorkflow> {
    const [newWorkflow] = await db.insert(schema.comfyWorkflows).values(workflow).returning();
    return newWorkflow;
  }

  async updateComfyWorkflow(id: number, workflow: Partial<InsertComfyWorkflow>): Promise<ComfyWorkflow> {
    const [updatedWorkflow] = await db.update(schema.comfyWorkflows)
      .set(workflow)
      .where(eq(schema.comfyWorkflows.id, id))
      .returning();
    return updatedWorkflow;
  }

  async deleteComfyWorkflow(id: number): Promise<void> {
    await db.delete(schema.comfyWorkflows).where(eq(schema.comfyWorkflows.id, id));
  }

  async getComfyGenerations(): Promise<ComfyGeneration[]> {
    return await db.select().from(schema.comfyGenerations);
  }

  async getComfyGenerationsByServer(serverId: number): Promise<ComfyGeneration[]> {
    return await db.select().from(schema.comfyGenerations).where(eq(schema.comfyGenerations.serverId, serverId));
  }

  async getComfyGeneration(id: number): Promise<ComfyGeneration | undefined> {
    const [generation] = await db.select().from(schema.comfyGenerations).where(eq(schema.comfyGenerations.id, id));
    return generation;
  }

  async createComfyGeneration(generation: InsertComfyGeneration): Promise<ComfyGeneration> {
    const [newGeneration] = await db.insert(schema.comfyGenerations).values(generation).returning();
    return newGeneration;
  }

  async updateComfyGeneration(id: number, generation: Partial<InsertComfyGeneration>): Promise<ComfyGeneration> {
    const [updatedGeneration] = await db.update(schema.comfyGenerations)
      .set(generation)
      .where(eq(schema.comfyGenerations.id, id))
      .returning();
    return updatedGeneration;
  }

  async deleteComfyGeneration(id: number): Promise<void> {
    await db.delete(schema.comfyGenerations).where(eq(schema.comfyGenerations.id, id));
  }

  async getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]> {
    let query = db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp));
    if (limit && offset) {
      return await query.limit(limit).offset(offset);
    } else if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(schema.auditLogs).values(log).returning();
    return newLog;
  }

  async getServerMoods(): Promise<ServerMood[]> {
    return await db.select().from(schema.serverMoods);
  }

  async getServerMoodsByCategory(category: string): Promise<ServerMood[]> {
    return await db.select().from(schema.serverMoods).where(eq(schema.serverMoods.category, category));
  }

  async getServerMood(id: number): Promise<ServerMood | undefined> {
    const [mood] = await db.select().from(schema.serverMoods).where(eq(schema.serverMoods.id, id));
    return mood;
  }

  async createServerMood(mood: InsertServerMood): Promise<ServerMood> {
    const [newMood] = await db.insert(schema.serverMoods).values(mood).returning();
    return newMood;
  }

  async updateServerMood(id: number, mood: Partial<InsertServerMood>): Promise<ServerMood> {
    const [updatedMood] = await db.update(schema.serverMoods)
      .set(mood)
      .where(eq(schema.serverMoods.id, id))
      .returning();
    return updatedMood;
  }

  async deleteServerMood(id: number): Promise<void> {
    await db.delete(schema.serverMoods).where(eq(schema.serverMoods.id, id));
  }

  async getServerMoodApplications(serverId: number): Promise<ServerMoodApplication[]> {
    return await db.select().from(schema.serverMoodApplications).where(eq(schema.serverMoodApplications.serverId, serverId));
  }

  async getCurrentServerMood(serverId: number): Promise<ServerMoodApplication | undefined> {
    const [application] = await db.select().from(schema.serverMoodApplications)
      .where(eq(schema.serverMoodApplications.serverId, serverId))
      .orderBy(desc(schema.serverMoodApplications.appliedAt))
      .limit(1);
    return application;
  }

  async createServerMoodApplication(application: InsertServerMoodApplication): Promise<ServerMoodApplication> {
    const [newApplication] = await db.insert(schema.serverMoodApplications).values(application).returning();
    return newApplication;
  }

  async revertServerMoodApplication(id: number): Promise<void> {
    await db.delete(schema.serverMoodApplications).where(eq(schema.serverMoodApplications.id, id));
  }

  async getWorkflowAnalyses(serverId?: number): Promise<WorkflowAnalysis[]> {
    if (serverId) {
      return await db.select().from(schema.workflowAnalysis).where(eq(schema.workflowAnalysis.serverId, serverId));
    }
    return await db.select().from(schema.workflowAnalysis);
  }

  async getWorkflowAnalysesByServer(serverId: number): Promise<WorkflowAnalysis[]> {
    return await db.select().from(schema.workflowAnalysis).where(eq(schema.workflowAnalysis.serverId, serverId));
  }

  async getWorkflowAnalysis(id: number): Promise<WorkflowAnalysis | undefined> {
    const [analysis] = await db.select().from(schema.workflowAnalysis).where(eq(schema.workflowAnalysis.id, id));
    return analysis;
  }

  async createWorkflowAnalysis(analysis: InsertWorkflowAnalysis): Promise<WorkflowAnalysis> {
    const [newAnalysis] = await db.insert(schema.workflowAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  async updateWorkflowAnalysis(id: number, analysis: Partial<InsertWorkflowAnalysis>): Promise<WorkflowAnalysis> {
    const [updatedAnalysis] = await db.update(schema.workflowAnalysis)
      .set(analysis)
      .where(eq(schema.workflowAnalysis.id, id))
      .returning();
    return updatedAnalysis;
  }

  async deleteWorkflowAnalysis(id: number): Promise<boolean> {
    const result = await db.delete(schema.workflowAnalysis).where(eq(schema.workflowAnalysis.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getServerExecutions(serverId?: number): Promise<ServerExecution[]> {
    if (serverId) {
      return await db.select().from(schema.serverExecutions).where(eq(schema.serverExecutions.serverId, serverId));
    }
    return await db.select().from(schema.serverExecutions);
  }

  async getServerExecution(id: number): Promise<ServerExecution | undefined> {
    const [execution] = await db.select().from(schema.serverExecutions).where(eq(schema.serverExecutions.id, id));
    return execution;
  }

  async createServerExecution(execution: InsertServerExecution): Promise<ServerExecution> {
    const [newExecution] = await db.insert(schema.serverExecutions).values(execution).returning();
    return newExecution;
  }

  async updateServerExecution(id: number, execution: Partial<InsertServerExecution>): Promise<ServerExecution> {
    const [updatedExecution] = await db.update(schema.serverExecutions)
      .set(execution)
      .where(eq(schema.serverExecutions.id, id))
      .returning();
    return updatedExecution;
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    const [preferences] = await db.select().from(schema.userPreferences).where(eq(schema.userPreferences.userId, userId));
    return preferences || null;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db.insert(schema.userPreferences).values(preferences).returning();
    return newPreferences;
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const [updatedPreferences] = await db.update(schema.userPreferences)
      .set(preferences)
      .where(eq(schema.userPreferences.userId, userId))
      .returning();
    return updatedPreferences;
  }

  async getWorkflowRecommendations(userId: number): Promise<WorkflowRecommendation[]> {
    return await db.select().from(schema.workflowRecommendations).where(eq(schema.workflowRecommendations.userId, userId));
  }

  async createWorkflowRecommendation(recommendation: InsertWorkflowRecommendation): Promise<WorkflowRecommendation> {
    const [newRecommendation] = await db.insert(schema.workflowRecommendations).values(recommendation).returning();
    return newRecommendation;
  }

  async updateWorkflowRecommendation(id: number, recommendation: Partial<InsertWorkflowRecommendation>): Promise<WorkflowRecommendation> {
    const [updatedRecommendation] = await db.update(schema.workflowRecommendations)
      .set(recommendation)
      .where(eq(schema.workflowRecommendations.id, id))
      .returning();
    return updatedRecommendation;
  }

  async deleteWorkflowRecommendation(id: number): Promise<boolean> {
    const result = await db.delete(schema.workflowRecommendations).where(eq(schema.workflowRecommendations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserInteractions(userId: number, limit?: number): Promise<UserInteraction[]> {
    let query = db.select().from(schema.userInteractions)
      .where(eq(schema.userInteractions.userId, userId))
      .orderBy(desc(schema.userInteractions.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction> {
    const [newInteraction] = await db.insert(schema.userInteractions).values(interaction).returning();
    return newInteraction;
  }

  async getUserGenerations(userId: number, limit?: number): Promise<ComfyGeneration[]> {
    let query = db.select().from(schema.comfyGenerations)
      .orderBy(desc(schema.comfyGenerations.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getRecentGenerations(limit?: number): Promise<ComfyGeneration[]> {
    let query = db.select().from(schema.comfyGenerations)
      .orderBy(desc(schema.comfyGenerations.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  // Workflow Analysis operations
  async getWorkflowAnalysesByServer(serverId: number): Promise<WorkflowAnalysis[]> {
    return await db.select().from(schema.workflowAnalysis)
      .where(eq(schema.workflowAnalysis.serverId, serverId))
      .orderBy(desc(schema.workflowAnalysis.createdAt));
  }

  async getWorkflowAnalysis(id: number): Promise<WorkflowAnalysis | undefined> {
    const [analysis] = await db.select().from(schema.workflowAnalysis)
      .where(eq(schema.workflowAnalysis.id, id));
    return analysis;
  }

  async getWorkflowAnalysisById(id: number): Promise<WorkflowAnalysis | undefined> {
    const [analysis] = await db.select().from(schema.workflowAnalysis)
      .where(eq(schema.workflowAnalysis.id, id));
    return analysis;
  }

  async createWorkflowAnalysis(analysis: InsertWorkflowAnalysis): Promise<WorkflowAnalysis> {
    const [newAnalysis] = await db.insert(schema.workflowAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  async updateWorkflowAnalysis(id: number, analysis: Partial<InsertWorkflowAnalysis>): Promise<WorkflowAnalysis> {
    const [updatedAnalysis] = await db.update(schema.workflowAnalysis)
      .set(analysis)
      .where(eq(schema.workflowAnalysis.id, id))
      .returning();
    return updatedAnalysis;
  }

  async deleteWorkflowAnalysis(id: number): Promise<boolean> {
    const result = await db.delete(schema.workflowAnalysis).where(eq(schema.workflowAnalysis.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Missing workflow methods
  async getWorkflowsWithModels(): Promise<ComfyWorkflow[]> {
    return await db.select().from(schema.comfyWorkflows)
      .orderBy(desc(schema.comfyWorkflows.createdAt));
  }

  async syncWorkflowModels(workflowId: number): Promise<void> {
    // Implementation for syncing workflow models
    // This would typically analyze the workflow and update its required models
    console.log(`Syncing models for workflow ${workflowId}`);
  }

  // Missing search methods
  async searchComfyModels(query: string): Promise<ComfyModel[]> {
    return await db.select().from(schema.comfyModels)
      .orderBy(desc(schema.comfyModels.createdAt));
  }

  async getModelsByStatus(status: string): Promise<ComfyModel[]> {
    return await db.select().from(schema.comfyModels)
      .where(eq(schema.comfyModels.status, status))
      .orderBy(desc(schema.comfyModels.createdAt));
  }

  // Missing content method
  async getContentById(id: number): Promise<Content | undefined> {
    const [content] = await db.select().from(schema.content).where(eq(schema.content.id, id));
    return content;
  }

  // Missing platform method
  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(schema.platforms).where(eq(schema.platforms.id, id));
    return platform;
  }

  // Missing stats method
  async getStats(): Promise<any> {
    return {
      totalUsers: 1,
      totalPlatforms: 1,
      totalContent: 1,
      totalAccounts: 1
    };
  }

  // Missing vast server methods
  async stopVastServer(id: number): Promise<void> {
    await db.update(schema.vastServers)
      .set({ status: 'stopped' })
      .where(eq(schema.vastServers.id, id));
  }

  // Missing setup script methods
  async getSetupScriptsByCategory(category: string): Promise<SetupScript[]> {
    return await db.select().from(schema.setupScripts)
      .where(eq(schema.setupScripts.category, category));
  }

  async getSetupScript(id: number): Promise<SetupScript | undefined> {
    const [script] = await db.select().from(schema.setupScripts).where(eq(schema.setupScripts.id, id));
    return script;
  }

  // Missing audit log methods
  async getAuditLogsByUser(userId: number): Promise<AuditLog[]> {
    return await db.select().from(schema.auditLogs)
      .where(eq(schema.auditLogs.userId, userId))
      .orderBy(desc(schema.auditLogs.timestamp));
  }

  async getAuditLogsByResource(resource: string): Promise<AuditLog[]> {
    return await db.select().from(schema.auditLogs)
      .where(eq(schema.auditLogs.resource, resource))
      .orderBy(desc(schema.auditLogs.timestamp));
  }

  // Missing comfy model methods
  async getComfyModelsByServerAndFolder(serverId: number, folder: string): Promise<ComfyModel[]> {
    return await db.select().from(schema.comfyModels)
      .where(eq(schema.comfyModels.serverId, serverId))
      .orderBy(desc(schema.comfyModels.createdAt));
  }
}

export const storage = new DatabaseStorage();