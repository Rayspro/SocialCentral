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
  getWorkflowAnalysis(id: number): Promise<WorkflowAnalysis | undefined>;
  createWorkflowAnalysis(analysis: InsertWorkflowAnalysis): Promise<WorkflowAnalysis>;
  updateWorkflowAnalysis(id: number, analysis: Partial<InsertWorkflowAnalysis>): Promise<WorkflowAnalysis>;
  deleteWorkflowAnalysis(id: number): Promise<void>;

  // Server execution operations
  getServerExecutions(serverId?: number): Promise<ServerExecution[]>;
  getServerExecution(id: number): Promise<ServerExecution | undefined>;
  createServerExecution(execution: InsertServerExecution): Promise<ServerExecution>;
  updateServerExecution(id: number, execution: Partial<InsertServerExecution>): Promise<ServerExecution>;
}

export class MemStorage implements IStorage {
  private users: User[] = [
    {
      id: 1,
      username: "demo",
      passwordHash: "$2b$10$K7L/lFxzxGeHWJmePw3.3eH8WkrMz8qE4OzYzFZw8c2UuGFq.4K8e", // "demo123"
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private platforms: Platform[] = [];
  private accounts: Account[] = [];
  private content: Content[] = [];
  private schedules: Schedule[] = [];
  private apiKeys: ApiKey[] = [];
  private vastServers: VastServer[] = [];
  private setupScripts: SetupScript[] = [];
  private comfyModels: ComfyModel[] = [];
  private comfyWorkflows: ComfyWorkflow[] = [];
  private comfyGenerations: ComfyGeneration[] = [];
  private auditLogs: AuditLog[] = [];
  private serverMoods: ServerMood[] = [];
  private serverMoodApplications: ServerMoodApplication[] = [];
  private workflowAnalyses: WorkflowAnalysis[] = [];
  private serverExecutions: ServerExecution[] = [];

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.users.length + 1,
      username: insertUser.username || null,
      passwordHash: insertUser.passwordHash,
      email: insertUser.email,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // Platform operations
  async getPlatforms(): Promise<Platform[]> {
    return this.platforms;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const newPlatform: Platform = {
      id: this.platforms.length + 1,
      ...platform,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.platforms.push(newPlatform);
    return newPlatform;
  }

  async updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform> {
    const index = this.platforms.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Platform not found");
    this.platforms[index] = { ...this.platforms[index], ...platform, updatedAt: new Date() };
    return this.platforms[index];
  }

  async deletePlatform(id: number): Promise<void> {
    const index = this.platforms.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Platform not found");
    this.platforms.splice(index, 1);
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    return this.accounts;
  }

  async getAccountsByPlatform(platformId: number): Promise<Account[]> {
    return this.accounts.filter(account => account.platformId === platformId);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const newAccount: Account = {
      id: this.accounts.length + 1,
      ...account,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.push(newAccount);
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Account not found");
    this.accounts[index] = { ...this.accounts[index], ...account, updatedAt: new Date() };
    return this.accounts[index];
  }

  async deleteAccount(id: number): Promise<void> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Account not found");
    this.accounts.splice(index, 1);
  }

  // Content operations
  async getContent(): Promise<Content[]> {
    return this.content;
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    return this.content.filter(c => c.status === status);
  }

  async createContent(content: InsertContent): Promise<Content> {
    const newContent: Content = {
      id: this.content.length + 1,
      ...content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.content.push(newContent);
    return newContent;
  }

  async updateContent(id: number, content: Partial<InsertContent>): Promise<Content> {
    const index = this.content.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Content not found");
    this.content[index] = { ...this.content[index], ...content, updatedAt: new Date() };
    return this.content[index];
  }

  async deleteContent(id: number): Promise<void> {
    const index = this.content.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Content not found");
    this.content.splice(index, 1);
  }

  // Schedule operations
  async getSchedules(): Promise<Schedule[]> {
    return this.schedules;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const newSchedule: Schedule = {
      id: this.schedules.length + 1,
      ...schedule,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule> {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Schedule not found");
    this.schedules[index] = { ...this.schedules[index], ...schedule, updatedAt: new Date() };
    return this.schedules[index];
  }

  async deleteSchedule(id: number): Promise<void> {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Schedule not found");
    this.schedules.splice(index, 1);
  }

  // API Key operations
  async getApiKeys(): Promise<ApiKey[]> {
    return this.apiKeys;
  }

  async getApiKeyByService(service: string): Promise<ApiKey | undefined> {
    return this.apiKeys.find(key => key.service === service && key.isActive);
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const newApiKey: ApiKey = {
      id: this.apiKeys.length + 1,
      ...apiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.apiKeys.push(newApiKey);
    return newApiKey;
  }

  async updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey> {
    const index = this.apiKeys.findIndex(a => a.id === id);
    if (index === -1) throw new Error("API Key not found");
    this.apiKeys[index] = { ...this.apiKeys[index], ...apiKey, updatedAt: new Date() };
    return this.apiKeys[index];
  }

  async deleteApiKey(id: number): Promise<void> {
    const index = this.apiKeys.findIndex(a => a.id === id);
    if (index === -1) throw new Error("API Key not found");
    this.apiKeys.splice(index, 1);
  }

  // Dashboard analytics
  async getDashboardAnalytics(): Promise<{
    totalPlatforms: number;
    totalAccounts: number;
    totalContent: number;
    publishedContent: number;
    scheduledContent: number;
    generatedMedia: number;
  }> {
    return {
      totalPlatforms: this.platforms.length,
      totalAccounts: this.accounts.length,
      totalContent: this.content.length,
      publishedContent: this.content.filter(c => c.status === 'published').length,
      scheduledContent: this.content.filter(c => c.status === 'scheduled').length,
      generatedMedia: this.content.filter(c => c.mediaUrls && c.mediaUrls.length > 0).length,
    };
  }

  // Vast server operations
  async getVastServers(): Promise<VastServer[]> {
    return this.vastServers;
  }

  async getVastServer(id: number): Promise<VastServer | undefined> {
    return this.vastServers.find(s => s.id === id);
  }

  async createVastServer(server: InsertVastServer): Promise<VastServer> {
    const newServer: VastServer = {
      id: this.vastServers.length + 1,
      ...server,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vastServers.push(newServer);
    return newServer;
  }

  async updateVastServer(id: number, server: Partial<InsertVastServer>): Promise<VastServer> {
    const index = this.vastServers.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Server not found");
    this.vastServers[index] = { ...this.vastServers[index], ...server, updatedAt: new Date() };
    return this.vastServers[index];
  }

  async deleteVastServer(id: number): Promise<void> {
    const index = this.vastServers.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Server not found");
    this.vastServers.splice(index, 1);
  }

  // Setup script operations
  async getSetupScripts(): Promise<SetupScript[]> {
    return this.setupScripts;
  }

  async createSetupScript(script: InsertSetupScript): Promise<SetupScript> {
    const newScript: SetupScript = {
      id: this.setupScripts.length + 1,
      ...script,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.setupScripts.push(newScript);
    return newScript;
  }

  async updateSetupScript(id: number, script: Partial<InsertSetupScript>): Promise<SetupScript> {
    const index = this.setupScripts.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Setup script not found");
    this.setupScripts[index] = { ...this.setupScripts[index], ...script, updatedAt: new Date() };
    return this.setupScripts[index];
  }

  async deleteSetupScript(id: number): Promise<void> {
    const index = this.setupScripts.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Setup script not found");
    this.setupScripts.splice(index, 1);
  }

  // ComfyUI operations
  async getComfyModels(): Promise<ComfyModel[]> {
    return this.comfyModels;
  }

  async getComfyModelsByServer(serverId: number): Promise<ComfyModel[]> {
    return this.comfyModels.filter(m => m.serverId === serverId);
  }

  async getComfyModel(id: number): Promise<ComfyModel | undefined> {
    return this.comfyModels.find(m => m.id === id);
  }

  async createComfyModel(model: InsertComfyModel): Promise<ComfyModel> {
    const newModel: ComfyModel = {
      id: this.comfyModels.length + 1,
      ...model,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comfyModels.push(newModel);
    return newModel;
  }

  async updateComfyModel(id: number, model: Partial<InsertComfyModel>): Promise<ComfyModel> {
    const index = this.comfyModels.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Model not found");
    this.comfyModels[index] = { ...this.comfyModels[index], ...model, updatedAt: new Date() };
    return this.comfyModels[index];
  }

  async deleteComfyModel(id: number): Promise<void> {
    const index = this.comfyModels.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Model not found");
    this.comfyModels.splice(index, 1);
  }

  async getComfyWorkflows(): Promise<ComfyWorkflow[]> {
    return this.comfyWorkflows;
  }

  async getComfyWorkflow(id: number): Promise<ComfyWorkflow | undefined> {
    return this.comfyWorkflows.find(w => w.id === id);
  }

  async createComfyWorkflow(workflow: InsertComfyWorkflow): Promise<ComfyWorkflow> {
    const newWorkflow: ComfyWorkflow = {
      id: this.comfyWorkflows.length + 1,
      ...workflow,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comfyWorkflows.push(newWorkflow);
    return newWorkflow;
  }

  async updateComfyWorkflow(id: number, workflow: Partial<InsertComfyWorkflow>): Promise<ComfyWorkflow> {
    const index = this.comfyWorkflows.findIndex(w => w.id === id);
    if (index === -1) throw new Error("Workflow not found");
    this.comfyWorkflows[index] = { ...this.comfyWorkflows[index], ...workflow, updatedAt: new Date() };
    return this.comfyWorkflows[index];
  }

  async deleteComfyWorkflow(id: number): Promise<void> {
    const index = this.comfyWorkflows.findIndex(w => w.id === id);
    if (index === -1) throw new Error("Workflow not found");
    this.comfyWorkflows.splice(index, 1);
  }

  async getComfyGenerations(): Promise<ComfyGeneration[]> {
    return this.comfyGenerations;
  }

  async getComfyGenerationsByServer(serverId: number): Promise<ComfyGeneration[]> {
    return this.comfyGenerations.filter(g => g.serverId === serverId);
  }

  async getComfyGeneration(id: number): Promise<ComfyGeneration | undefined> {
    return this.comfyGenerations.find(g => g.id === id);
  }

  async createComfyGeneration(generation: InsertComfyGeneration): Promise<ComfyGeneration> {
    const newGeneration: ComfyGeneration = {
      id: this.comfyGenerations.length + 1,
      ...generation,
      createdAt: new Date(),
      completedAt: null,
    };
    this.comfyGenerations.push(newGeneration);
    return newGeneration;
  }

  async updateComfyGeneration(id: number, generation: Partial<InsertComfyGeneration>): Promise<ComfyGeneration> {
    const index = this.comfyGenerations.findIndex(g => g.id === id);
    if (index === -1) throw new Error("Generation not found");
    this.comfyGenerations[index] = { ...this.comfyGenerations[index], ...generation };
    return this.comfyGenerations[index];
  }

  async deleteComfyGeneration(id: number): Promise<void> {
    const index = this.comfyGenerations.findIndex(g => g.id === id);
    if (index === -1) throw new Error("Generation not found");
    this.comfyGenerations.splice(index, 1);
  }

  // Audit log operations
  async getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]> {
    const logs = this.auditLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (limit && offset) {
      return logs.slice(offset, offset + limit);
    }
    return logs;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: this.auditLogs.length + 1,
      ...log,
      timestamp: new Date(),
    };
    this.auditLogs.push(newLog);
    return newLog;
  }

  // Server mood operations
  async getServerMoods(): Promise<ServerMood[]> {
    return this.serverMoods;
  }

  async getServerMoodsByCategory(category: string): Promise<ServerMood[]> {
    return this.serverMoods.filter(m => m.category === category);
  }

  async getServerMood(id: number): Promise<ServerMood | undefined> {
    return this.serverMoods.find(m => m.id === id);
  }

  async createServerMood(mood: InsertServerMood): Promise<ServerMood> {
    const newMood: ServerMood = {
      id: this.serverMoods.length + 1,
      ...mood,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.serverMoods.push(newMood);
    return newMood;
  }

  async updateServerMood(id: number, mood: Partial<InsertServerMood>): Promise<ServerMood> {
    const index = this.serverMoods.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Server mood not found");
    this.serverMoods[index] = { ...this.serverMoods[index], ...mood, updatedAt: new Date() };
    return this.serverMoods[index];
  }

  async deleteServerMood(id: number): Promise<void> {
    const index = this.serverMoods.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Server mood not found");
    this.serverMoods.splice(index, 1);
  }

  async getServerMoodApplications(serverId: number): Promise<ServerMoodApplication[]> {
    return this.serverMoodApplications.filter(a => a.serverId === serverId);
  }

  async getCurrentServerMood(serverId: number): Promise<ServerMoodApplication | undefined> {
    return this.serverMoodApplications
      .filter(a => a.serverId === serverId && a.status === 'active')
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())[0];
  }

  async createServerMoodApplication(application: InsertServerMoodApplication): Promise<ServerMoodApplication> {
    const newApplication: ServerMoodApplication = {
      id: this.serverMoodApplications.length + 1,
      ...application,
      appliedAt: new Date(),
    };
    this.serverMoodApplications.push(newApplication);
    return newApplication;
  }

  async revertServerMoodApplication(id: number): Promise<void> {
    const index = this.serverMoodApplications.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Server mood application not found");
    this.serverMoodApplications[index].status = 'reverted';
  }

  // Workflow analysis operations
  async getWorkflowAnalyses(serverId?: number): Promise<WorkflowAnalysis[]> {
    if (serverId) {
      return this.workflowAnalyses.filter(a => a.serverId === serverId);
    }
    return this.workflowAnalyses;
  }

  async getWorkflowAnalysis(id: number): Promise<WorkflowAnalysis | undefined> {
    return this.workflowAnalyses.find(a => a.id === id);
  }

  async createWorkflowAnalysis(analysis: InsertWorkflowAnalysis): Promise<WorkflowAnalysis> {
    const newAnalysis: WorkflowAnalysis = {
      id: this.workflowAnalyses.length + 1,
      ...analysis,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflowAnalyses.push(newAnalysis);
    return newAnalysis;
  }

  async updateWorkflowAnalysis(id: number, analysis: Partial<InsertWorkflowAnalysis>): Promise<WorkflowAnalysis> {
    const index = this.workflowAnalyses.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Workflow analysis not found");
    this.workflowAnalyses[index] = { ...this.workflowAnalyses[index], ...analysis, updatedAt: new Date() };
    return this.workflowAnalyses[index];
  }

  async deleteWorkflowAnalysis(id: number): Promise<void> {
    const index = this.workflowAnalyses.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Workflow analysis not found");
    this.workflowAnalyses.splice(index, 1);
  }

  // Server execution operations
  async getServerExecutions(serverId?: number): Promise<ServerExecution[]> {
    if (serverId) {
      return this.serverExecutions.filter(e => e.serverId === serverId);
    }
    return this.serverExecutions;
  }

  async getServerExecution(id: number): Promise<ServerExecution | undefined> {
    return this.serverExecutions.find(e => e.id === id);
  }

  async createServerExecution(execution: InsertServerExecution): Promise<ServerExecution> {
    const newExecution: ServerExecution = {
      id: this.serverExecutions.length + 1,
      ...execution,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.serverExecutions.push(newExecution);
    return newExecution;
  }

  async updateServerExecution(id: number, execution: Partial<InsertServerExecution>): Promise<ServerExecution> {
    const index = this.serverExecutions.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Server execution not found");
    this.serverExecutions[index] = { ...this.serverExecutions[index], ...execution, updatedAt: new Date() };
    return this.serverExecutions[index];
  }
}

export const storage = new MemStorage();