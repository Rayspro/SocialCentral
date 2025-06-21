import {
  users,
  platforms,
  accounts,
  content,
  schedules,
  apiKeys,
  vastServers,
  setupScripts,
  serverExecutions,
  comfyModels,
  comfyWorkflows,
  comfyGenerations,
  auditLogs,
  workflowAnalysis,
  serverMoods,
  serverMoodApplications,
  type User,
  type InsertUser,
  type Platform,
  type InsertPlatform,
  type Account,
  type InsertAccount,
  type Content,
  type InsertContent,
  type Schedule,
  type InsertSchedule,
  type ApiKey,
  type InsertApiKey,
  type VastServer,
  type InsertVastServer,
  type SetupScript,
  type InsertSetupScript,
  type ServerExecution,
  type InsertServerExecution,
  type ComfyModel,
  type InsertComfyModel,
  type ComfyWorkflow,
  type InsertComfyWorkflow,
  type ComfyGeneration,
  type InsertComfyGeneration,
  type AuditLog,
  type InsertAuditLog,
  type WorkflowAnalysis,
  type InsertWorkflowAnalysis,
  type ServerMood,
  type InsertServerMood,
  type ServerMoodApplication,
  type InsertServerMoodApplication,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Platform methods
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform | undefined>;

  // Account methods
  getAccounts(): Promise<Account[]>;
  getAccountsByPlatform(platformId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Content methods
  getContent(): Promise<Content[]>;
  getContentByStatus(status: string): Promise<Content[]>;
  getContentById(id: number): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<InsertContent>): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;

  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  getSchedulesByAccount(accountId: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;

  // API Key methods
  getApiKeys(): Promise<ApiKey[]>;
  getApiKeyByService(service: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<boolean>;

  // Vast Server methods
  getVastServers(): Promise<VastServer[]>;
  getVastServer(id: number): Promise<VastServer | undefined>;
  getVastServerByVastId(vastId: string): Promise<VastServer | undefined>;
  createVastServer(server: InsertVastServer): Promise<VastServer>;
  updateVastServer(id: number, server: Partial<InsertVastServer>): Promise<VastServer | undefined>;
  deleteVastServer(id: number): Promise<boolean>;
  launchVastServer(id: number): Promise<VastServer | undefined>;
  stopVastServer(id: number): Promise<VastServer | undefined>;

  // Setup Script methods
  getSetupScripts(): Promise<SetupScript[]>;
  getSetupScript(id: number): Promise<SetupScript | undefined>;
  getSetupScriptsByCategory(category: string): Promise<SetupScript[]>;
  createSetupScript(script: InsertSetupScript): Promise<SetupScript>;
  updateSetupScript(id: number, script: Partial<InsertSetupScript>): Promise<SetupScript | undefined>;
  deleteSetupScript(id: number): Promise<boolean>;

  // Server Execution methods
  getServerExecutions(serverId: number): Promise<ServerExecution[]>;
  createServerExecution(execution: InsertServerExecution): Promise<ServerExecution>;
  updateServerExecution(id: number, execution: Partial<InsertServerExecution>): Promise<ServerExecution | undefined>;

  // ComfyUI Model methods
  getComfyModels(): Promise<ComfyModel[]>;
  getComfyModelsByServer(serverId: number): Promise<ComfyModel[]>;
  getComfyModel(id: number): Promise<ComfyModel | undefined>;
  createComfyModel(model: InsertComfyModel): Promise<ComfyModel>;
  updateComfyModel(id: number, model: Partial<InsertComfyModel>): Promise<ComfyModel | undefined>;
  deleteComfyModel(id: number): Promise<boolean>;

  // ComfyUI Workflow methods
  getComfyWorkflows(): Promise<ComfyWorkflow[]>;
  getComfyWorkflow(id: number): Promise<ComfyWorkflow | undefined>;
  createComfyWorkflow(workflow: InsertComfyWorkflow): Promise<ComfyWorkflow>;
  updateComfyWorkflow(id: number, workflow: Partial<InsertComfyWorkflow>): Promise<ComfyWorkflow | undefined>;
  deleteComfyWorkflow(id: number): Promise<boolean>;

  // ComfyUI Generation methods
  getComfyGenerations(): Promise<ComfyGeneration[]>;
  getComfyGenerationsByServer(serverId: number): Promise<ComfyGeneration[]>;
  getComfyGeneration(id: number): Promise<ComfyGeneration | undefined>;
  createComfyGeneration(generation: InsertComfyGeneration): Promise<ComfyGeneration>;
  updateComfyGeneration(id: number, generation: Partial<InsertComfyGeneration>): Promise<ComfyGeneration | undefined>;
  deleteComfyGeneration(id: number): Promise<boolean>;

  // Workflow Analysis methods
  getWorkflowAnalysis(serverId: number): Promise<WorkflowAnalysis[]>;
  getWorkflowAnalysisById(id: number): Promise<WorkflowAnalysis | undefined>;
  createWorkflowAnalysis(analysis: InsertWorkflowAnalysis): Promise<WorkflowAnalysis>;
  updateWorkflowAnalysis(id: number, analysis: Partial<InsertWorkflowAnalysis>): Promise<WorkflowAnalysis | undefined>;
  deleteWorkflowAnalysis(id: number): Promise<boolean>;

  // Enhanced Model Management methods
  getComfyModelsByServerAndFolder(serverId: number, folder: string): Promise<ComfyModel[]>;
  getComfyModelByNameAndServer(name: string, serverId: number): Promise<ComfyModel | undefined>;
  searchComfyModels(query: string): Promise<ComfyModel[]>;
  getModelsByStatus(status: string): Promise<ComfyModel[]>;
  
  // Audit Log methods
  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: number, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByResource(resource: string, resourceId?: string): Promise<AuditLog[]>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;

  // Server Mood methods
  getServerMoods(): Promise<ServerMood[]>;
  getServerMood(id: number): Promise<ServerMood | undefined>;
  getServerMoodsByCategory(category: string): Promise<ServerMood[]>;
  createServerMood(mood: InsertServerMood): Promise<ServerMood>;
  updateServerMood(id: number, mood: Partial<InsertServerMood>): Promise<ServerMood | undefined>;
  deleteServerMood(id: number): Promise<boolean>;
  
  // Server Mood Application methods
  getServerMoodApplications(serverId: number): Promise<ServerMoodApplication[]>;
  getCurrentServerMood(serverId: number): Promise<ServerMood | undefined>;
  createServerMoodApplication(application: InsertServerMoodApplication): Promise<ServerMoodApplication>;
  revertServerMoodApplication(applicationId: number): Promise<boolean>;

  // Stats
  getStats(): Promise<{
    connectedAccounts: number;
    pendingApprovals: number;
    postsThisMonth: number;
    generatedMedia: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms);
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform || undefined;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db.insert(platforms).values(platform).returning();
    return newPlatform;
  }

  async updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const [updated] = await db.update(platforms)
      .set(platform)
      .where(eq(platforms.id, id))
      .returning();
    return updated || undefined;
  }

  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccountsByPlatform(platformId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.platformId, platformId));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updated] = await db.update(accounts)
      .set(account)
      .where(eq(accounts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return true;
  }

  async getContent(): Promise<Content[]> {
    return await db.select().from(content);
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.status, status));
  }

  async getContentById(id: number): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, id));
    return item || undefined;
  }

  async createContent(contentData: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(content).values(contentData).returning();
    return newContent;
  }

  async updateContent(id: number, contentData: Partial<InsertContent>): Promise<Content | undefined> {
    const [updated] = await db.update(content)
      .set(contentData)
      .where(eq(content.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContent(id: number): Promise<boolean> {
    const result = await db.delete(content).where(eq(content.id, id));
    return true;
  }

  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }

  async getSchedulesByAccount(accountId: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.accountId, accountId));
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values({
      ...schedule,
      publishedAt: null,
    }).returning();
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [updated] = await db.update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return updated || undefined;
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys);
  }

  async getApiKeyByService(service: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.service, service));
    return apiKey || undefined;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [updated] = await db.update(apiKeys)
      .set(apiKey)
      .where(eq(apiKeys.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return true;
  }

  async getStats(): Promise<{
    connectedAccounts: number;
    pendingApprovals: number;
    postsThisMonth: number;
    generatedMedia: number;
  }> {
    const allAccounts = await db.select().from(accounts);
    const pendingContent = await db.select().from(content).where(eq(content.status, "pending"));
    const allContent = await db.select().from(content);
    
    return {
      connectedAccounts: allAccounts.length,
      pendingApprovals: pendingContent.length,
      postsThisMonth: 12,
      generatedMedia: allContent.length,
    };
  }

  // Vast Server methods
  async getVastServers(): Promise<VastServer[]> {
    return await db.select().from(vastServers);
  }

  async getVastServer(id: number): Promise<VastServer | undefined> {
    const results = await db.select().from(vastServers).where(eq(vastServers.id, id));
    return results[0];
  }

  async getVastServerByVastId(vastId: string): Promise<VastServer | undefined> {
    const results = await db.select().from(vastServers).where(eq(vastServers.vastId, vastId));
    return results[0];
  }

  async createVastServer(server: InsertVastServer): Promise<VastServer> {
    const results = await db.insert(vastServers).values(server).returning();
    return results[0];
  }

  async updateVastServer(id: number, server: Partial<InsertVastServer>): Promise<VastServer | undefined> {
    const results = await db
      .update(vastServers)
      .set(server)
      .where(eq(vastServers.id, id))
      .returning();
    return results[0];
  }

  async deleteVastServer(id: number): Promise<boolean> {
    const results = await db.delete(vastServers).where(eq(vastServers.id, id)).returning();
    return results.length > 0;
  }

  async launchVastServer(id: number): Promise<VastServer | undefined> {
    const results = await db
      .update(vastServers)
      .set({
        isLaunched: true,
        status: "launching",
        launchedAt: new Date(),
      })
      .where(eq(vastServers.id, id))
      .returning();
    return results[0];
  }

  async stopVastServer(id: number): Promise<VastServer | undefined> {
    const results = await db
      .update(vastServers)
      .set({
        isLaunched: false,
        status: "stopping",
        serverUrl: null,
      })
      .where(eq(vastServers.id, id))
      .returning();
    return results[0];
  }

  // Setup Script methods
  async getSetupScripts(): Promise<SetupScript[]> {
    return await db.select().from(setupScripts);
  }

  async getSetupScript(id: number): Promise<SetupScript | undefined> {
    const results = await db.select().from(setupScripts).where(eq(setupScripts.id, id));
    return results[0];
  }

  async getSetupScriptsByCategory(category: string): Promise<SetupScript[]> {
    return await db.select().from(setupScripts).where(eq(setupScripts.category, category));
  }

  async createSetupScript(script: InsertSetupScript): Promise<SetupScript> {
    const results = await db.insert(setupScripts).values(script).returning();
    return results[0];
  }

  async updateSetupScript(id: number, script: Partial<InsertSetupScript>): Promise<SetupScript | undefined> {
    const results = await db
      .update(setupScripts)
      .set(script)
      .where(eq(setupScripts.id, id))
      .returning();
    return results[0];
  }

  async deleteSetupScript(id: number): Promise<boolean> {
    const results = await db.delete(setupScripts).where(eq(setupScripts.id, id)).returning();
    return results.length > 0;
  }

  // Server Execution methods
  async getServerExecutions(serverId: number): Promise<ServerExecution[]> {
    return await db.select().from(serverExecutions).where(eq(serverExecutions.serverId, serverId));
  }

  async createServerExecution(execution: InsertServerExecution): Promise<ServerExecution> {
    const results = await db.insert(serverExecutions).values(execution).returning();
    return results[0];
  }

  async updateServerExecution(id: number, execution: Partial<InsertServerExecution>): Promise<ServerExecution | undefined> {
    const results = await db
      .update(serverExecutions)
      .set(execution)
      .where(eq(serverExecutions.id, id))
      .returning();
    return results[0];
  }
}

// Temporarily using MemStorage due to database connection issues
// export const storage = new DatabaseStorage();

class MemStorage implements IStorage {
  private users: User[] = [
    {
      id: 1,
      username: "demo",
      passwordHash: "$2b$10$TPP5DUtiI07byHlbciAbxelPY/Ik49x3i5ZMTpKXKp96IAYXDIEp2", // password: "demo123"
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
  private platforms: Platform[] = [
    { id: 1, name: "youtube", displayName: "YouTube", icon: "youtube", color: "#FF0000", isActive: true },
    { id: 2, name: "instagram", displayName: "Instagram", icon: "instagram", color: "#E4405F", isActive: true },
    { id: 3, name: "twitter", displayName: "Twitter", icon: "twitter", color: "#1DA1F2", isActive: true },
    { id: 4, name: "linkedin", displayName: "LinkedIn", icon: "linkedin", color: "#0077B5", isActive: true }
  ];
  private accounts: Account[] = [
    { id: 1, platformId: 1, name: "Tech Channel", username: "@techchannel", isActive: true, accessToken: "yt_token", refreshToken: "yt_refresh", externalId: "yt123", metadata: {}, createdAt: new Date() },
    { id: 2, platformId: 2, name: "Brand Account", username: "@brandaccount", isActive: true, accessToken: "ig_token", refreshToken: "ig_refresh", externalId: "ig123", metadata: {}, createdAt: new Date() },
    { id: 3, platformId: 3, name: "Company Twitter", username: "@company", isActive: true, accessToken: "tw_token", refreshToken: "tw_refresh", externalId: "tw123", metadata: {}, createdAt: new Date() },
    { id: 4, platformId: 4, name: "Professional", username: "@professional", isActive: true, accessToken: "li_token", refreshToken: "li_refresh", externalId: "li123", metadata: {}, createdAt: new Date() }
  ];
  private content: Content[] = [
    { id: 1, title: "Travel Video Story", description: "Amazing journey through mountains", type: "video", sourceText: "A story about mountain adventures", status: "pending", platformId: 1, accountId: 1, contentUrl: null, generationPrompt: null, metadata: {}, createdAt: new Date(), thumbnailUrl: null, updatedAt: new Date() }
  ];
  private schedules: Schedule[] = [];
  private apiKeys: ApiKey[] = [];
  private vastServers: VastServer[] = [];
  private setupScripts: SetupScript[] = [
    {
      id: 1,
      name: "ComfyUI Setup",
      description: "Complete ComfyUI installation with dependencies",
      category: "ai-tools",
      script: `#!/bin/bash
# ComfyUI Installation Script
echo "Starting ComfyUI installation..."
cd /workspace
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
python -m pip install -r requirements.txt
echo "ComfyUI installation completed!"`,
      isActive: true,
      estimatedTime: 15,
      requirements: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: "Stable Diffusion Models",
      description: "Download essential Stable Diffusion models",
      category: "models",
      script: `#!/bin/bash
# Download SD Models
echo "Downloading Stable Diffusion models..."
cd /workspace/ComfyUI/models/checkpoints
wget https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt
echo "Model download completed!"`,
      isActive: true,
      estimatedTime: 10,
      requirements: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: "ComfyUI Auto-Start Service",
      description: "Set up ComfyUI to start automatically and run in background",
      category: "ai-tools",
      script: `#!/bin/bash
# ComfyUI Auto-Start Setup
echo "Setting up ComfyUI auto-start service..."

# Create startup script
cat > /workspace/start_comfyui.sh << 'EOF'
#!/bin/bash
cd /workspace/ComfyUI
python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header &
echo "ComfyUI started on port 8188"
EOF

chmod +x /workspace/start_comfyui.sh

# Start ComfyUI now
echo "Starting ComfyUI server..."
/workspace/start_comfyui.sh

# Add to bashrc for auto-start
echo "/workspace/start_comfyui.sh" >> ~/.bashrc

echo "ComfyUI auto-start setup completed!"
echo "ComfyUI is now running at http://YOUR_SERVER_IP:8188"
echo "It will start automatically when you connect to the server"`,
      isActive: true,
      estimatedTime: 5,
      requirements: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  private serverExecutions: ServerExecution[] = [];
  private comfyModels: ComfyModel[] = [];
  private comfyWorkflows: ComfyWorkflow[] = [];
  private comfyGenerations: ComfyGeneration[] = [];
  private auditLogs: AuditLog[] = [];
  private workflowAnalyses: WorkflowAnalysis[] = [];
  private serverMoods: ServerMood[] = [
    {
      id: 1,
      name: "AI Powerhouse",
      description: "Optimized for AI/ML workloads with maximum GPU utilization",
      icon: "brain",
      color: "purple",
      category: "ai",
      configuration: {
        comfySettings: {
          autoStartup: true,
          modelPresets: ["sd_xl_base", "sd_xl_refiner"],
          workflowTemplates: ["text2img", "img2img"],
          performanceMode: "maximum"
        },
        systemSettings: {
          ramAllocation: "80%",
          gpuBoost: true,
          cpuPriority: "high",
          storageOptimization: true
        },
        networkSettings: {
          bandwidth: "unlimited",
          latencyOptimization: true,
          portForwarding: ["8188", "7860"]
        }
      },
      isBuiltIn: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: "Gaming Beast",
      description: "High-performance gaming configuration with low latency",
      icon: "gamepad",
      color: "red",
      category: "gaming",
      configuration: {
        comfySettings: {
          autoStartup: false,
          modelPresets: [],
          workflowTemplates: [],
          performanceMode: "gaming"
        },
        systemSettings: {
          ramAllocation: "90%",
          gpuBoost: true,
          cpuPriority: "realtime",
          storageOptimization: false
        },
        networkSettings: {
          bandwidth: "unlimited",
          latencyOptimization: true,
          portForwarding: ["25565", "27015", "7777"]
        }
      },
      isBuiltIn: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: "Developer Focus",
      description: "Balanced setup for coding and development work",
      icon: "code",
      color: "blue",
      category: "development",
      configuration: {
        comfySettings: {
          autoStartup: false,
          modelPresets: [],
          workflowTemplates: [],
          performanceMode: "balanced"
        },
        systemSettings: {
          ramAllocation: "70%",
          gpuBoost: false,
          cpuPriority: "normal",
          storageOptimization: true
        },
        networkSettings: {
          bandwidth: "normal",
          latencyOptimization: false,
          portForwarding: ["3000", "8080", "5000"]
        }
      },
      isBuiltIn: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 4,
      name: "Productivity Pro",
      description: "Optimized for work and productivity applications",
      icon: "target",
      color: "green",
      category: "productivity",
      configuration: {
        comfySettings: {
          autoStartup: false,
          modelPresets: [],
          workflowTemplates: [],
          performanceMode: "efficiency"
        },
        systemSettings: {
          ramAllocation: "60%",
          gpuBoost: false,
          cpuPriority: "normal",
          storageOptimization: true
        },
        networkSettings: {
          bandwidth: "normal",
          latencyOptimization: false,
          portForwarding: ["80", "443"]
        }
      },
      isBuiltIn: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 5,
      name: "Creative Studio",
      description: "Perfect for creative work with ComfyUI and media processing",
      icon: "sparkles",
      color: "pink",
      category: "ai",
      configuration: {
        comfySettings: {
          autoStartup: true,
          modelPresets: ["sd_xl_base", "controlnet", "lora_models"],
          workflowTemplates: ["creative_workflow", "batch_processing"],
          performanceMode: "creative"
        },
        systemSettings: {
          ramAllocation: "75%",
          gpuBoost: true,
          cpuPriority: "high",
          storageOptimization: false
        },
        networkSettings: {
          bandwidth: "high",
          latencyOptimization: true,
          portForwarding: ["8188", "8080"]
        }
      },
      isBuiltIn: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 6,
      name: "Speed Demon",
      description: "Maximum performance for demanding computational tasks",
      icon: "rocket",
      color: "orange",
      category: "ai",
      configuration: {
        comfySettings: {
          autoStartup: true,
          modelPresets: ["fastest_models"],
          workflowTemplates: ["speed_optimized"],
          performanceMode: "turbo"
        },
        systemSettings: {
          ramAllocation: "95%",
          gpuBoost: true,
          cpuPriority: "realtime",
          storageOptimization: false
        },
        networkSettings: {
          bandwidth: "unlimited",
          latencyOptimization: true,
          portForwarding: ["8188"]
        }
      },
      isBuiltIn: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  private serverMoodApplications: ServerMoodApplication[] = [];

  private nextId = 1;
  private nextUserId = 2;
  private nextPlatformId = 5;
  private nextAccountId = 5;
  private nextContentId = 2;
  private nextScheduleId = 1;
  private nextApiKeyId = 1;
  private nextVastServerId = 1;
  private nextSetupScriptId = 4;
  private nextServerExecutionId = 1;
  private nextComfyModelId = 1;
  private nextComfyWorkflowId = 1;
  private nextComfyGenerationId = 1;
  private nextAuditLogId = 1;
  private nextWorkflowAnalysisId = 1;
  private nextMoodId = 7;
  private nextMoodApplicationId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.users.length + 1;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async getPlatforms(): Promise<Platform[]> {
    return this.platforms;
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    return this.platforms.find(p => p.id === id);
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const newPlatform = { ...platform, id: this.platforms.length + 1 } as Platform;
    this.platforms.push(newPlatform);
    return newPlatform;
  }

  async updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const index = this.platforms.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.platforms[index] = { ...this.platforms[index], ...platform };
    return this.platforms[index];
  }

  async getAccounts(): Promise<Account[]> {
    return this.accounts;
  }

  async getAccountsByPlatform(platformId: number): Promise<Account[]> {
    return this.accounts.filter(a => a.platformId === platformId);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.find(a => a.id === id);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const newAccount = { ...account, id: this.accounts.length + 1 } as Account;
    this.accounts.push(newAccount);
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    this.accounts[index] = { ...this.accounts[index], ...account };
    return this.accounts[index];
  }

  async deleteAccount(id: number): Promise<boolean> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.accounts.splice(index, 1);
    return true;
  }

  async getContent(): Promise<Content[]> {
    return this.content;
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    return this.content.filter(c => c.status === status);
  }

  async getContentById(id: number): Promise<Content | undefined> {
    return this.content.find(c => c.id === id);
  }

  async createContent(contentData: InsertContent): Promise<Content> {
    const newContent = { ...contentData, id: this.content.length + 1 } as Content;
    this.content.push(newContent);
    return newContent;
  }

  async updateContent(id: number, contentData: Partial<InsertContent>): Promise<Content | undefined> {
    const index = this.content.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.content[index] = { ...this.content[index], ...contentData };
    return this.content[index];
  }

  async deleteContent(id: number): Promise<boolean> {
    const index = this.content.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.content.splice(index, 1);
    return true;
  }

  async getSchedules(): Promise<Schedule[]> {
    return this.schedules;
  }

  async getSchedulesByAccount(accountId: number): Promise<Schedule[]> {
    return this.schedules.filter(s => s.accountId === accountId);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const newSchedule = { ...schedule, id: this.schedules.length + 1 } as Schedule;
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.schedules[index] = { ...this.schedules[index], ...schedule };
    return this.schedules[index];
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return this.apiKeys;
  }

  async getApiKeyByService(service: string): Promise<ApiKey | undefined> {
    return this.apiKeys.find(k => k.service === service && k.isActive);
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const newApiKey = { ...apiKey, id: this.apiKeys.length + 1, isActive: true } as ApiKey;
    this.apiKeys.push(newApiKey);
    return newApiKey;
  }

  async updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const index = this.apiKeys.findIndex(k => k.id === id);
    if (index === -1) return undefined;
    this.apiKeys[index] = { ...this.apiKeys[index], ...apiKey };
    return this.apiKeys[index];
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const index = this.apiKeys.findIndex(k => k.id === id);
    if (index === -1) return false;
    this.apiKeys.splice(index, 1);
    return true;
  }

  async getStats(): Promise<{ connectedAccounts: number; pendingApprovals: number; postsThisMonth: number; generatedMedia: number; }> {
    return {
      connectedAccounts: this.accounts.length,
      pendingApprovals: this.content.filter(c => c.status === 'pending').length,
      postsThisMonth: this.content.length,
      generatedMedia: this.content.filter(c => c.type === 'image' || c.type === 'video').length
    };
  }

  // Vast Server methods
  async getVastServers(): Promise<VastServer[]> {
    return this.vastServers;
  }

  async getVastServer(id: number): Promise<VastServer | undefined> {
    return this.vastServers.find(s => s.id === id);
  }

  async getVastServerByVastId(vastId: string): Promise<VastServer | undefined> {
    return this.vastServers.find(s => s.vastId === vastId);
  }

  async createVastServer(server: InsertVastServer): Promise<VastServer> {
    const newServer = { ...server, id: this.vastServers.length + 1, createdAt: new Date(), updatedAt: new Date() } as VastServer;
    this.vastServers.push(newServer);

    // Log server creation
    await this.createAuditLog({
      category: 'user_action',
      userId: 1,
      action: 'vast_server_created',
      resource: 'vast_server',
      resourceId: newServer.id.toString(),
      details: {
        serverName: server.name,
        gpu: server.gpu,
        price: server.price,
        region: server.region
      },
      severity: 'info'
    });

    return newServer;
  }

  async updateVastServer(id: number, server: Partial<InsertVastServer>): Promise<VastServer | undefined> {
    const index = this.vastServers.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const oldServer = this.vastServers[index];
    this.vastServers[index] = { ...this.vastServers[index], ...server, updatedAt: new Date() };
    
    // Log server update
    await this.createAuditLog({
      category: 'system_event',
      userId: 1,
      action: 'vast_server_updated',
      resource: 'vast_server',
      resourceId: id.toString(),
      details: {
        serverName: oldServer.name,
        changes: server,
        previousStatus: oldServer.status,
        newStatus: server.status || oldServer.status
      },
      severity: 'info'
    });
    
    return this.vastServers[index];
  }

  async deleteVastServer(id: number): Promise<boolean> {
    const index = this.vastServers.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    const server = this.vastServers[index];
    this.vastServers.splice(index, 1);
    
    // Log server deletion
    await this.createAuditLog({
      category: 'user_action',
      userId: 1,
      action: 'vast_server_deleted',
      resource: 'vast_server',
      resourceId: id.toString(),
      details: {
        serverName: server.name,
        gpu: server.gpu,
        status: server.status,
        vastId: server.vastId
      },
      severity: 'warning'
    });
    
    return true;
  }

  async launchVastServer(id: number): Promise<VastServer | undefined> {
    const server = await this.getVastServer(id);
    if (!server) return undefined;
    
    // Log server launch
    await this.createAuditLog({
      category: 'user_action',
      userId: 1,
      action: 'vast_server_launched',
      resource: 'vast_server',
      resourceId: id.toString(),
      details: {
        serverName: server.name,
        gpu: server.gpu,
        pricePerHour: server.pricePerHour,
        location: server.location
      },
      severity: 'info'
    });
    
    return this.updateVastServer(id, { status: 'running', isLaunched: true });
  }

  async stopVastServer(id: number): Promise<VastServer | undefined> {
    const server = await this.getVastServer(id);
    if (!server) return undefined;
    
    // Log server stop
    await this.createAuditLog({
      category: 'user_action',
      userId: 1,
      action: 'vast_server_stopped',
      resource: 'vast_server',
      resourceId: id.toString(),
      details: {
        serverName: server.name,
        gpu: server.gpu,
        pricePerHour: server.pricePerHour,
        location: server.location
      },
      severity: 'info'
    });
    
    return this.updateVastServer(id, { status: 'stopped', isLaunched: false });
  }

  // Setup Script methods
  async getSetupScripts(): Promise<SetupScript[]> {
    return this.setupScripts;
  }

  async getSetupScript(id: number): Promise<SetupScript | undefined> {
    return this.setupScripts.find(s => s.id === id);
  }

  async getSetupScriptsByCategory(category: string): Promise<SetupScript[]> {
    return this.setupScripts.filter(s => s.category === category);
  }

  async createSetupScript(script: InsertSetupScript): Promise<SetupScript> {
    const newScript = { ...script, id: this.setupScripts.length + 1, createdAt: new Date(), updatedAt: new Date() } as SetupScript;
    this.setupScripts.push(newScript);
    return newScript;
  }

  async updateSetupScript(id: number, script: Partial<InsertSetupScript>): Promise<SetupScript | undefined> {
    const index = this.setupScripts.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.setupScripts[index] = { ...this.setupScripts[index], ...script, updatedAt: new Date() };
    return this.setupScripts[index];
  }

  async deleteSetupScript(id: number): Promise<boolean> {
    const index = this.setupScripts.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.setupScripts.splice(index, 1);
    return true;
  }

  // Server Execution methods
  async getServerExecutions(serverId: number): Promise<ServerExecution[]> {
    return this.serverExecutions.filter(e => e.serverId === serverId);
  }

  async createServerExecution(execution: InsertServerExecution): Promise<ServerExecution> {
    const newExecution = { ...execution, id: this.serverExecutions.length + 1, createdAt: new Date() } as ServerExecution;
    this.serverExecutions.push(newExecution);
    return newExecution;
  }

  async updateServerExecution(id: number, execution: Partial<InsertServerExecution>): Promise<ServerExecution | undefined> {
    const index = this.serverExecutions.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    this.serverExecutions[index] = { ...this.serverExecutions[index], ...execution };
    return this.serverExecutions[index];
  }

  // ComfyUI Model methods
  async getComfyModels(): Promise<ComfyModel[]> {
    return this.comfyModels.slice();
  }

  async getComfyModelsByServer(serverId: number): Promise<ComfyModel[]> {
    return this.comfyModels.filter(m => m.serverId === serverId);
  }

  async getComfyModel(id: number): Promise<ComfyModel | undefined> {
    return this.comfyModels.find(m => m.id === id);
  }

  async createComfyModel(model: InsertComfyModel): Promise<ComfyModel> {
    const newModel: ComfyModel = {
      ...model,
      status: model.status || 'pending',
      description: model.description || null,
      serverId: model.serverId || null,
      fileName: model.fileName || null,
      fileSize: model.fileSize || null,
      downloadProgress: model.downloadProgress || null,
      errorMessage: model.errorMessage || null,
      id: this.comfyModels.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comfyModels.push(newModel);
    return newModel;
  }

  async updateComfyModel(id: number, model: Partial<InsertComfyModel>): Promise<ComfyModel | undefined> {
    const index = this.comfyModels.findIndex(m => m.id === id);
    if (index === -1) return undefined;

    this.comfyModels[index] = { ...this.comfyModels[index], ...model, updatedAt: new Date() };
    return this.comfyModels[index];
  }

  async deleteComfyModel(id: number): Promise<boolean> {
    const index = this.comfyModels.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.comfyModels.splice(index, 1);
    return true;
  }

  // ComfyUI Workflow methods
  async getComfyWorkflows(): Promise<ComfyWorkflow[]> {
    return this.comfyWorkflows.slice();
  }

  async getComfyWorkflow(id: number): Promise<ComfyWorkflow | undefined> {
    return this.comfyWorkflows.find(w => w.id === id);
  }

  async createComfyWorkflow(workflow: InsertComfyWorkflow): Promise<ComfyWorkflow> {
    const newWorkflow: ComfyWorkflow = {
      ...workflow,
      id: this.comfyWorkflows.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comfyWorkflows.push(newWorkflow);
    return newWorkflow;
  }

  async updateComfyWorkflow(id: number, workflow: Partial<InsertComfyWorkflow>): Promise<ComfyWorkflow | undefined> {
    const index = this.comfyWorkflows.findIndex(w => w.id === id);
    if (index === -1) return undefined;

    this.comfyWorkflows[index] = { ...this.comfyWorkflows[index], ...workflow, updatedAt: new Date() };
    return this.comfyWorkflows[index];
  }

  async deleteComfyWorkflow(id: number): Promise<boolean> {
    const index = this.comfyWorkflows.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.comfyWorkflows.splice(index, 1);
    return true;
  }

  // ComfyUI Generation methods
  async getComfyGenerations(): Promise<ComfyGeneration[]> {
    return this.comfyGenerations.slice();
  }

  async getComfyGenerationsByServer(serverId: number): Promise<ComfyGeneration[]> {
    return this.comfyGenerations.filter(g => g.serverId === serverId);
  }

  async getComfyGeneration(id: number): Promise<ComfyGeneration | undefined> {
    return this.comfyGenerations.find(g => g.id === id);
  }

  async createComfyGeneration(generation: InsertComfyGeneration): Promise<ComfyGeneration> {
    const newGeneration: ComfyGeneration = {
      ...generation,
      id: this.comfyGenerations.length + 1,
      createdAt: new Date(),
      completedAt: null,
    };
    this.comfyGenerations.push(newGeneration);

    // Log ComfyUI generation start
    await this.createAuditLog({
      category: 'user_action',
      userId: 1,
      action: 'comfy_generation_started',
      resource: 'comfy_generation',
      resourceId: newGeneration.id.toString(),
      details: {
        serverId: generation.serverId,
        prompt: generation.prompt,
        workflowId: generation.workflowId,
        queueId: generation.queueId
      },
      severity: 'info'
    });

    return newGeneration;
  }

  async updateComfyGeneration(id: number, generation: Partial<InsertComfyGeneration>): Promise<ComfyGeneration | undefined> {
    const index = this.comfyGenerations.findIndex(g => g.id === id);
    if (index === -1) return undefined;

    this.comfyGenerations[index] = { ...this.comfyGenerations[index], ...generation };
    return this.comfyGenerations[index];
  }

  async deleteComfyGeneration(id: number): Promise<boolean> {
    const index = this.comfyGenerations.findIndex(g => g.id === id);
    if (index === -1) return false;

    this.comfyGenerations.splice(index, 1);
    return true;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs;
  }

  async createAuditLog(auditLogData: InsertAuditLog): Promise<AuditLog> {
    const auditLog = {
      id: this.nextAuditLogId++,
      ...auditLogData,
      timestamp: auditLogData.timestamp || new Date(),
    };
    this.auditLogs.push(auditLog);
    return auditLog;
  }

  // Workflow Analysis methods
  async getWorkflowAnalyses(): Promise<WorkflowAnalysis[]> {
    return this.workflowAnalyses;
  }

  async getWorkflowAnalysis(serverId: number): Promise<WorkflowAnalysis[]> {
    return this.workflowAnalyses.filter(wa => wa.serverId === serverId);
  }

  async getWorkflowAnalysisById(id: number): Promise<WorkflowAnalysis | undefined> {
    return this.workflowAnalyses.find(wa => wa.id === id);
  }

  async createWorkflowAnalysis(analysisData: InsertWorkflowAnalysis): Promise<WorkflowAnalysis> {
    const analysis = {
      id: this.nextWorkflowAnalysisId++,
      ...analysisData,
      analysisStatus: analysisData.analysisStatus || 'pending',
      downloadStatus: analysisData.downloadStatus || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflowAnalyses.push(analysis);
    return analysis;
  }

  async updateWorkflowAnalysis(id: number, analysisData: Partial<InsertWorkflowAnalysis>): Promise<WorkflowAnalysis | undefined> {
    const index = this.workflowAnalyses.findIndex(wa => wa.id === id);
    if (index === -1) return undefined;

    this.workflowAnalyses[index] = {
      ...this.workflowAnalyses[index],
      ...analysisData,
      updatedAt: new Date(),
    };
    return this.workflowAnalyses[index];
  }

  async deleteWorkflowAnalysis(id: number): Promise<boolean> {
    const index = this.workflowAnalyses.findIndex(wa => wa.id === id);
    if (index === -1) return false;

    this.workflowAnalyses.splice(index, 1);
    return true;
  }

  // Enhanced Model methods
  async searchComfyModels(query: string): Promise<ComfyModel[]> {
    return this.comfyModels.filter(model => 
      model.name.toLowerCase().includes(query.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async getModelsByStatus(status: string): Promise<ComfyModel[]> {
    return this.comfyModels.filter(model => model.status === status);
  }

  // Server Mood Configurator methods
  async getServerMoods(): Promise<ServerMood[]> {
    return this.serverMoods;
  }

  async getServerMood(id: number): Promise<ServerMood | undefined> {
    return this.serverMoods.find(mood => mood.id === id);
  }

  async getServerMoodsByCategory(category: string): Promise<ServerMood[]> {
    return this.serverMoods.filter(mood => mood.category === category);
  }

  async createServerMood(moodData: InsertServerMood): Promise<ServerMood> {
    const mood = {
      id: this.nextMoodId++,
      ...moodData,
      isActive: moodData.isActive ?? true,
      isBuiltIn: moodData.isBuiltIn ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.serverMoods.push(mood);
    return mood;
  }

  async updateServerMood(id: number, moodData: Partial<InsertServerMood>): Promise<ServerMood | undefined> {
    const index = this.serverMoods.findIndex(mood => mood.id === id);
    if (index === -1) return undefined;

    this.serverMoods[index] = {
      ...this.serverMoods[index],
      ...moodData,
      updatedAt: new Date(),
    };
    return this.serverMoods[index];
  }

  async deleteServerMood(id: number): Promise<boolean> {
    const index = this.serverMoods.findIndex(mood => mood.id === id);
    if (index === -1) return false;

    this.serverMoods.splice(index, 1);
    return true;
  }

  // Server Mood Application methods
  async getServerMoodApplications(serverId: number): Promise<ServerMoodApplication[]> {
    return this.serverMoodApplications
      .filter(app => app.serverId === serverId)
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }

  async getCurrentServerMood(serverId: number): Promise<ServerMood | undefined> {
    const applications = this.serverMoodApplications
      .filter(app => app.serverId === serverId && app.status === 'applied')
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
    
    if (applications.length === 0) return undefined;
    
    return this.serverMoods.find(mood => mood.id === applications[0].moodId);
  }

  async createServerMoodApplication(applicationData: InsertServerMoodApplication): Promise<ServerMoodApplication> {
    const application = {
      id: this.nextMoodApplicationId++,
      ...applicationData,
      status: applicationData.status || 'applied',
      appliedAt: new Date(),
    };
    this.serverMoodApplications.push(application);
    return application;
  }

  async revertServerMoodApplication(applicationId: number): Promise<boolean> {
    const application = this.serverMoodApplications.find(app => app.id === applicationId);
    if (!application) return false;

    application.status = 'reverted';
    return true;
  }

  // Additional methods required by IStorage interface
  async getComfyModelsByServerAndFolder(serverId: number, folder: string): Promise<ComfyModel[]> {
    return this.comfyModels.filter(m => m.serverId === serverId && m.folder === folder);
  }

  async getComfyModelByNameAndServer(name: string, serverId: number): Promise<ComfyModel | undefined> {
    return this.comfyModels.find(m => m.name === name && m.serverId === serverId);
  }

  async getAuditLogsByUser(userId: number, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getAuditLogsByResource(resource: string, resourceId?: string): Promise<AuditLog[]> {
    return this.auditLogs
      .filter(log => {
        if (resourceId) {
          return log.resource === resource && log.resourceId === resourceId;
        }
        return log.resource === resource;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const storage = new MemStorage();